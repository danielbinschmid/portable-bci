<template>
    <div id="muse-vis">
        <small-card
            :icon="'mdi-cctv'"
            :isMenuOpened="visModesInstantiated"
            :popupName="'VIS'"
            @openMenu="showModes()"
            topMargin
        >
            <overlay-back-button @exit="showModes()" bottomPadding />
            <v-list style="padding: 0" color="rgba(0, 0, 0, 0)">
                <v-list-item-group
                    :color="layout_data.GREEN"
                    v-model="currentMode"
                     
                >
                    <div v-for="(item, i) in visModes" :key="i">
                        <v-divider> </v-divider>
                        <icon-list-item :item="item" />
                    </div>
                    <v-divider> </v-divider>
                </v-list-item-group>
            </v-list>

            <muse-raw-eeg
                :isActivated="isRawEEGMode"
                :museDevInfo="museDevInfo"
                @exit="clearCurrentMode()"
            />

            <v-dialog v-model="isFBands" fullscreen>
                <v-card :color="layout_data.WHITE_BACKGROUND"> 
                    <frequency-bands :museDevInfo="museDevInfo" @exit="clearCurrentMode()" />
                </v-card>
            </v-dialog>
        </small-card>
    </div>
</template>

<script>
import FrequencyBands from "@/components/visualization/FrequencyBands.vue"
import IconListItem from "@/components/ui-comps/IconListItem.vue";
import OverlayBackButton from "@/components/ui-comps/OverlayBackButton.vue";
import { LAYOUT_DATA } from "@/data/layout_constraints";
import TwoButtonCard from "@/components/ui-comps/TwoButtonCard.vue";
import MuseRawEEGVis from "@/components/visualization/MuseRawEEGVis.vue";
import MuseRawEeg from "./MuseRawEEG.vue";
import SmallCard from "@/components/ui-comps/SmallCard.vue";
export default {
    name: "MuseVis",
    components: {
        IconListItem,
        OverlayBackButton,
        TwoButtonCard,
        MuseRawEEGVis,
        MuseRawEeg,
        SmallCard,
        FrequencyBands,
    },
    props: {
        museDevInfo: undefined,
        isStreamingEnabled: Boolean
    },
    data() {
        const rawEEGMode = "RAW EEG";
        return {
            layout_data: LAYOUT_DATA,
            rawEEGMode: rawEEGMode,
            visModes: [rawEEGMode, "FREQUENCY BANDS"],
            visModesInstantiated: false,
            currentMode: null,
            vCardStyle: { marginTop: LAYOUT_DATA.MARGIN_TOP },
        };
    },
    methods: {
        back() {
            this.$emit("back");
        },
        control() {
            this.$emit("control");
        },
        showModes() {
            this.visModesInstantiated = !this.visModesInstantiated;
        },
        clearCurrentMode() {
            this.currentMode = null;
        },
    },
    computed: {
        isMuseConnected() {
            return this.museDevInfo != undefined;
        },
        isRawEEGMode() {
            return (this.visModes[this.currentMode] == this.rawEEGMode) && this.isStreamingEnabled;
        },
        isFBands() {
            return (this.currentMode == 1) && this.isStreamingEnabled
        }
    },
    watch: {
        isStreamingEnabled() {
            this.currentMode = null
        }
    }
};
</script>

<style scoped>
</style>