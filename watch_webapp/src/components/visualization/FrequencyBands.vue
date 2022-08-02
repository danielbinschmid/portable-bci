<template>
    <div id="frequency-bands">
        <overlay-back-button @exit="exit()" />

        <simple-button @click="openSettings()" bottomPadding>
            {{ "channel: " + channels[selectedChannel] }}
        </simple-button>
        <div v-for="(item, i) in this.fBands" :key="item[0] + '_' + i">
            <div
                class="mdc-typography-styles-overline"
                :style="{
                    color: layout.GREEN,
                }"
            >
                {{ item[0] + ": " + item[1] + ' Bels'}}
            </div>
        </div>
        <simple-button
            @click="isStreaming ? stopStreaming() : startStreaming()"
            :color="isStreaming ? layout.ORANGE : layout.GREEN"
        >
            {{ isStreaming ? "STOP" : "START" }}
        </simple-button>

        <v-dialog v-model="settings" fullscreen>
            <v-card :color="'rgba(236, 239, 241, 0.95)'">
                <overlay-back-button @exit="closeSettings()" />
                <v-list-item>
                    <v-divider />
                    <div
                        class="mdc-typography-styles-overline"
                        :style="{
                            color: layout.GREEN,
                        }"
                    >
                        SELECT CHANNEL
                    </div>
                    <v-divider />
                </v-list-item>
                <div v-for="(item, i) in channels" :key="i">
                    <select-list-item
                        :name="item"
                        :selected="selectedChannel == i"
                        @select="setSelectedChannel(i)"
                    />
                </div>
            </v-card>
        </v-dialog>
    </div>
</template>
    
    
    
    
<script>
import Vue from "vue";
import SelectListItem from "@/components/ui-comps/SelectListItem.vue";
import { EmittingStreaming } from "@/tools/ble/EmittingStreaming";
import OverlayBackButton from "@/components/ui-comps/OverlayBackButton.vue";
import SimpleButton from "@/components/ui-comps/SimpleButton.vue";
import { toFrequencyBands } from "@/tools/scripts/frequencyBands";
import { CHANNEL_NAMES_EEG, EEG_FREQUENCY } from "@/data/constants";
import { arange, flatten2 } from "@/tools/evaluation/data_utils/array_utils";
export default {
    name: "FrequencyBands",
    components: { OverlayBackButton, SimpleButton, SelectListItem },
    data() {
        const streaming = new EmittingStreaming(this.museDevInfo, 200);
        return {
            settings: false,
            layout: window.layout,
            fBands: [
                ["delta", 0],
                ["theta", 0],
                ["alpha", 0],
                ["beta", 0],
                ["gamma", 0],
            ],
            channels: CHANNEL_NAMES_EEG,
            selectedChannel: 2,
            streaming: streaming,
            isStreaming: false,
        };
    },
    props: {
        museDevInfo: undefined,
    },
    beforeDestroy() {
        this.stopStreaming();
    },
    methods: {
        exit() {
            this.stopStreaming();
            this.$emit("exit");
        },
        setSelectedChannel(cIdx) {
            this.selectedChannel = cIdx;
        },
        openSettings() {
            this.settings = true;
        },
        closeSettings() {
            this.settings = false;
        },
        emitCallback(emit, index) {
            if (index == this.selectedChannel) {
                const arr = flatten2(emit)
                console.log(arr)
                const fBands = toFrequencyBands(arr, EEG_FREQUENCY);
                for (const i of arange(0, this.fBands.length - 1)) {
                    this.fBands[i][1] = Math.round((fBands[i] + Number.EPSILON) * 100) / 100;
                } 
                Vue.set(
                    this.fBands,
                    this.fBands.length - 1,
                    [this.fBands[this.fBands.length - 1][0], Math.round((fBands[this.fBands.length - 1] + Number.EPSILON) * 100) / 100]
                );
            }
        },
        startStreaming() {
            this.isStreaming = true;
            this.streaming.subscribe(this.emitCallback, (err) => {
                console.log(err);
            });
        },
        stopStreaming() {
            this.streaming = false;
            this.streaming.unsubscribe(
                (succ) => {
                    console.log(succ);
                },
                (err) => {
                    console.log(err);
                }
            );
        },
    },
};
</script>
    
<style scoped>
.mdc-typography-styles-overline {
    font-family: unquote("Roboto");
    font-size: 10;
    letter-spacing: 1.25px;
}
.center {
    margin-left: auto;
    margin-right: auto;
    width: 100%;
}
.icon {
    margin-top: 10%;
}
.abitright-2 {
    margin-right: 8% !important;
    margin-left: 0%;
}
</style>