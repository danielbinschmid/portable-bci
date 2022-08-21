<template>
    <div id="trial-vis">
        <overlay-back-button @exit="exit" />
        <simple-button
            @click="isReplaying ? stopReplay() : startReplay()"
            :color="isReplaying ? layout.ORANGE : layout.GREEN"
            bottomPadding
        >
            {{ isReplaying ? "STOP" : "REPLAY" }}
        </simple-button>
        <v-dialog v-model="settings" fullscreen>
            <v-card :color="'rgba(236, 239, 241, 0.95)'">
                <overlay-back-button @exit="closeSettings()" />
                <slider-list-item
                    v-model="minMaxRange"
                    :max="1000"
                    :min="50"
                    :step="50"
                    :name="'μV - range'"
                />
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

        <v-list-item>
            <v-divider class="divider-style" />
            <v-subheader> RECORDING </v-subheader>
            <v-divider class="divider-style" />
        </v-list-item>
        <dynamic-line-chart
            :currentVal="currentVal"
            :minMaxRange="minMaxRange"
            :height="50"
        />

        <simple-button @click="openSettings()"> SETTINGS </simple-button>

        <div v-for="(log, index) in logs" :key="index">
            {{ log }}
        </div>
    </div>
</template>

<script>
import SelectListItem from "@/components/ui-comps/SelectListItem.vue";
import SimpleButton from "@/components/ui-comps/SimpleButton.vue";
import SliderListItem from "@/components/ui-comps/SliderListItem.vue";
import OverlayBackButton from "@/components/ui-comps/OverlayBackButton.vue";
import DynamicLineChart from "./DynamicLineChart.vue";
import { CHANNEL_NAMES_EEG, EEG_FREQUENCY } from "@/data/constants";
export default {
    name: "TrialVis",
    components: {
        DynamicLineChart,
        OverlayBackButton,
        SliderListItem,
        SimpleButton,
        SelectListItem,
    },
    props: {
        trialData: undefined,
        frequency: Number,
    },
    data() {
        var ms = Math.floor(1000 / EEG_FREQUENCY);
        if (this.frequency) {
            ms = Math.floor(1000 / this.frequency);
        }
        return {
            visData: this.trialData,
            isOpen: false,
            minMaxRange: 100,
            settings: false,
            layout: window.layout,
            isReplaying: false,
            selectedChannel: 2,
            ms: ms,
            logs: [],
            channels: CHANNEL_NAMES_EEG,
            currentVal: 0,
            curIdx: 0,
            interval: undefined,
        };
    },
    methods: {
        genData() {
            const dummy = [];
            for (var c = 0; c < 4; c++) {
                const dummyC = [];
                for (var t = 0; t < 4 * EEG_FREQUENCY; t++) {
                    dummyC.push((Math.random() - 0.5) * 2 * this.minMaxRange);
                }
                dummy.push(dummyC);
            }
            this.visData = dummy;
        },
        setSelectedChannel(idx) {
            this.selectedChannel = idx;
        },
        closeSettings() {
            this.settings = false;
        },
        openSettings() {
            this.settings = true;
        },
        exit() {
            this.$emit("exit");
        },
        stopReplay() {
            clearInterval(this.interval);
            this.curIdx = 0;
            this.currentVal = 0;
            this.isReplaying = false;
        },
        startReplay() {
            console.log(this.ms);
            this.interval = setInterval(() => {
                if (this.curIdx > this.visData[this.selectedChannel].length) {
                    this.stopReplay();
                }
                this.currentVal = {
                    timestamp: Date.now(),
                    val: this.visData[this.selectedChannel][this.curIdx],
                };
                this.curIdx += 1;
                console.log("here");
            }, this.ms);
            this.isReplaying = true;
        },
    },
    mounted() {
        if (this.trialData === undefined) {
            this.genData();
        } else {
            this.visData = this.trialData;
        }
    },
    activated() {
        if (this.trialData === undefined) {
            this.genData();
        } else {
            this.visData = this.trialData;
        }
    },
    deactivated() {
        this.stopReplay();
    },
    destroyed() {
        this.stopReplay();
    },
};
</script>

<style scoped>
.divider-style {
    margin: 5%;
}
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