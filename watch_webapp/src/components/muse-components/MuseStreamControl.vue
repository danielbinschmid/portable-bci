<template>
    <div id="muse-stream-control">
        <settings-card
            :disabled="!connectedToMuse"
            :icon="streamingIcon"
            :isOpened="areStreamingModesInstantiated"
            :text="'Streaming'"
            @openMain="streamBtn()"
            @openSettings="instantiateStreamingModes()"
        >
            <overlay-back-button @exit="instantiateStreamingModes()" />
            <div v-for="(item, i) in streamingModes" :key="i">
                <select-list-item
                    :name="item"
                    :selected="currentMode == item"
                    @select="setStreamMode(item)"
                />
            </div>
            <bottom-padding />
        </settings-card>
        <div v-for="(log, index) in logs" :key="index">
            {{ log }}
        </div>
    </div>
</template>

<script>
import BottomPadding from "@/components/ui-comps/BottomPadding.vue";
import SelectListItem from "@/components/ui-comps/SelectListItem.vue";
import OverlayBackButton from "@/components/ui-comps/OverlayBackButton.vue";
import SettingsCard from "@/components/ui-comps/SettingsCard.vue";
import { LAYOUT_DATA } from "@/data/layout_constraints.js";
import { MuseStreamingModes } from "@/data/enums";
import { startRecording, pauseRecording } from "@/scripts/museUtils";
export default {
    name: "MuseStreamControl",
    props: {
        connectedDevice: undefined,
        streaming: Boolean,
    },
    components: {
        SettingsCard,
        OverlayBackButton,
        SelectListItem,
        BottomPadding,
    },
    data() {
        return {
            randomStreaming: false,
            absolute: false,
            opacity: 0.8,
            MuseStreamingModes: MuseStreamingModes,
            streamingModes: [
                MuseStreamingModes.EEG,
                MuseStreamingModes.PGB,
                MuseStreamingModes.AUX,
                MuseStreamingModes.RAND,
            ],
            currentMode: MuseStreamingModes.EEG,
            areStreamingModesInstantiated: false,
            layout_data: LAYOUT_DATA,
            cardStyleObject: {
                marginTop: LAYOUT_DATA.MARGIN_TOP,
            },
            logs: [],
        };
    },
    methods: {
        instantiateStreamingModes() {
            this.areStreamingModesInstantiated =
                !this.areStreamingModesInstantiated;
        },
        stopStreaming() {
            var vm = this;
            pauseRecording(
                this.connectedDevice.address,
                (result) => {
                    this.$emit("streamingChange", false);
                },
                (error) => {
                    this.logs.push(error);
                }
            );
        },
        startStreaming(mode) {
            var preset = "";
            var vm = this;
            switch (mode) {
                case MuseStreamingModes.EEG:
                    preset = "p21";
                    break;
                case MuseStreamingModes.PGB:
                    preset = "p50";
                    break;
                case MuseStreamingModes.AUX:
                    preset = "p20";
                    break;
                case MuseStreamingModes.idle:
                default:
            }
            startRecording(
                this.connectedDevice.address,
                (result) => {},
                (err) => {
                    vm.logs.push(err);
                },
                preset
            );
            this.$emit("streamingChange", true);
        },
        setStreamMode(mode) {
            this.currentMode = mode;
        },
        streamBtn() {
            if (this.currentMode == MuseStreamingModes.RAND) {
                this.randomStreaming = true;
                window.randomStreaming = true;
                this.$emit("streamingChange", true);
            } else {
                if (this.randomStreaming) {
                    window.randomStreaming = false;
                    this.randomStreaming = false;
                    this.$emit("streamingChange", false);
                } else {
                    this.streaming
                    ? this.stopStreaming()
                    : this.startStreaming(this.currentMode);
                }
                
                
            }
        },
    },
    computed: {
        streamingIcon() {
            if (this.randomStreaming) {
                return "mdi-access-point-check"
            } else {
                if (this.connectedToMuse) {
                    if (!this.streaming) {
                        return "mdi-cog-pause";
                    } else {
                        return "mdi-access-point-check";
                    }
                } else {
                    return "mdi-link-variant-off";
                }
            }
        },
        connectedToMuse() {
            const isConnected = this.connectedDevice != undefined;
            if (!isConnected) {
                this.$emit("streamingChange", false);
            }
            return isConnected;
        },
    },
    watch: {
        currentMode() {
            if (this.currentMode == MuseStreamingModes.RAND) {
                this.streamBtn();
            } else if (this.randomStreaming){
                this.streamBtn();
            }
        }
    }
};
</script>

<style scoped>
</style>