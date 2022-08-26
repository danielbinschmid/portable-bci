<template>
    <div id="mind-reading">
        <v-list style="padding: 0" color="rgba(0, 0, 0, 0)">
            <overlay-back-button @exit="exit()" bottomPadding withText>
                READ MIND
            </overlay-back-button>

            <v-list-item>
                <v-list-item-icon>
                    <v-icon :color="layout_data.GREEN">
                        mdi-information-variant
                    </v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                    <div
                        name="muse name"
                        class="mdc-typography-styles-overline"
                        :style="{ color: layout_data.GREY }"
                    >
                        {{ info }}
                    </div>
                </v-list-item-content>
            </v-list-item>

            <simple-button @click="startTrial()" :disabled="!resetted">
                Start Imagine
            </simple-button>
            <simple-button @click="warmupEEGNet()" :disabled="!resetted">
                <div v-if="!isPredicting">WARM UP AI</div>
                <div v-else>
                    <half-circle-spinner
                        :animation-duration="1800"
                        :size="layout_data.MAX_WIDTH / 12"
                        class="topcenter"
                        :color="layout_data.GREEN"
                    />
                </div>
            </simple-button>

            <bottom-padding />
        </v-list>

        <v-dialog v-model="isTrial" fullscreen>
            <v-card color="rgba(236, 239, 241, 0.95)">
                <overlay-back-button
                    @exit="cancelTrial()"
                    bottomPadding
                />
                <div v-if="state == 'prepare' || state == 'trial'">
                    <div
                        class="mdc-typography-styles-overline"
                        :style="{
                            color: layout_data.GREY,
                        }"
                    >
                        {{ "IMAGINE MOVEMENT" }}
                    </div>
                    <div v-if="state == 'prepare'">
                        <v-progress-circular
                            class="topcenter"
                            :rotate="180"
                            :size="100"
                            :width="15"
                            :value="uiValue"
                            :color="'orange'"
                        >
                            {{ (uiValue * 2.5) / 100 + "s" }}
                        </v-progress-circular>
                    </div>
                    <div v-else>
                        <v-progress-circular
                            class="topcenter"
                            :rotate="180"
                            :size="100"
                            :width="15"
                            :value="uiValue"
                            :color="'pink'"
                        >
                            {{ (uiValue * 4) / 100 + "s" }}
                        </v-progress-circular>
                    </div>
                    <div
                        name="muse name"
                        class="mdc-typography-styles-overline"
                        :style="{ color: layout_data.GREY }"
                    >
                        {{ state == "prepare" ? "PREPARE" : "IMAGINE" }}
                    </div>
                </div>
                <div v-else-if="state == 'loading'">
                    <breeding-rhombus-spinner
                        :animation-duration="1800"
                        :size="layout_data.MAX_WIDTH / 6"
                        class="topcenter"
                        :color="'dark-pink'"
                    />
                </div>
                <div v-else>
                    <div class="texttop">
                        {{ prediction }}
                    </div>

                    <simple-button @click="startTrial()" :disabled="!resetted">
                        RETRY
                    </simple-button>

                    <simple-button @click="replayTrial()" :disabled="!resetted">
                        REPLAY
                    </simple-button>

                    <v-dialog v-model="openReplayTrial" fullscreen>
                        <v-card :color="layout_data.WHITE_BACKGROUND">
                            <trial-vis
                                @exit="closeReplay()"
                                :frequency="targetFrequency"
                                :trialData="curTrial"
                            />
                        </v-card>
                    </v-dialog>
                </div>
                <bottom-padding />
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import OverlayBackButton from "@/components/ui-comps/OverlayBackButton.vue";
import SimpleButton from "@/components/ui-comps/SimpleButton.vue";
import TrialVis from "@/components/visualization/TrialVis.vue";
import {
    BreedingRhombusSpinner,
    HalfCircleSpinner,
} from "epic-spinners/dist/lib/epic-spinners.min.js";
import { MuseBLEStreaming } from "@/tools/ble/MuseBLEStreaming";
import { EEG_FREQUENCY } from "@/data/constants";
import { EEGNet } from "@/tools/eegnet/load";
import {
    resample2ndDim,
    slice2ndDim,
    maxIdx,
} from "@/tools/data_utils/array_utils";
import BottomPadding from "@/components/ui-comps/BottomPadding.vue";
export default {
    components: {
        BottomPadding,
        BreedingRhombusSpinner,
        OverlayBackButton,
        SimpleButton,
        TrialVis,
        HalfCircleSpinner,
    },
    name: "MindReading",
    data() {
        /** @type { MuseBLEStreaming } */
        var bleStreaming = undefined;
        if (this.museDevInfo) {
            bleStreaming = new MuseBLEStreaming(this.museDevInfo, 6.5);
        }
        const ms = Math.floor(5000 / EEG_FREQUENCY);
        return {
            ms: ms,
            isPredicting: false,
            curTrial: [[], [], [], []],
            targetFrequency: 128,
            openReplayTrial: false,
            bleStreaming: bleStreaming,
            labels: ["FEET", "RIGHT ARM", "LEFT ARM"],
            prediction: "CLASS A",
            interval: {},
            value: 0,
            uiIter: 0,
            uiDelay: 20,
            uiValue: 0,
            isTrial: false,
            state: "idle",
            layout_data: window.layout,
            logs: [],
            resetted: true,
        };
    },
    props: {
        museDevInfo: undefined,
        finetunedSession: undefined,
    },
    methods: {
        closeReplay() {
            this.openReplayTrial = false;
        },
        replayTrial() {
            this.openReplayTrial = true;
        },
        warmupEEGNet() {
            const vm = this;
            vm.isPredicting = true;
            window.eegnet.warmUpPrediction().then(() => {
                vm.isPredicting = false;
            });
        },
        exit() {
            this.$emit("exit");
        },
        /**
         * @param {number[][]} timeseries
         */
        streamSuccCallback(timeseries) {
            this.state = "loading";
            if (window.randomStreaming) {
                clearInterval(this.interval);
                this.resetted = true;
            } else {
                const vm = this;
                this.bleStreaming.unsubscribe(
                    (result) => {
                        vm.bleStreaming.reset();
                        vm.resetted = true;
                    },
                    (err) => {
                        console.log(err);
                    }
                );
                this.bleStreaming.reset();
            }
            this.value = 0;
            this.uiValue = 0;
            this.uiIter = 0;

            const targetFrequency = 128;
            const trial = resample2ndDim(
                targetFrequency * 4.0,
                slice2ndDim(
                    2.5 * EEG_FREQUENCY,
                    6.5 * EEG_FREQUENCY,
                    timeseries
                )
            );
            this.curTrial = trial;

            /** @type {EEGNet} */
            const eegnet = window.eegnet;
            if (eegnet === undefined) {
                this.state = "idle";
                this.prediction = this.labels[0];
            }
            eegnet.prediction(trial).then((prediction) => {
                const labelIdx = maxIdx(prediction);
                this.prediction = this.labels[labelIdx];

                this.state = "idle";
            });
        },
        timestepCallback(nTimesteps) {
            if (this.state == "prepare") {
                this.value += (nTimesteps * 100) / (EEG_FREQUENCY * 2.5);
                this.uiIter += 1;
                if (this.uiIter % this.uiDelay == 0) {
                    this.uiValue = Math.floor(this.value);
                }
            } else {
                this.value += (nTimesteps * 100) / (EEG_FREQUENCY * 4);
                this.uiIter += 1;
                if (this.uiIter % this.uiDelay == 0) {
                    this.uiValue = Math.floor(this.value);
                }
            }

            if (this.value >= 100) {
                this.value = 0;
                this.state = "trial";
            }
        },
        startTrial() {
            this.state = "prepare";
            this.curTrial = [[], [], [], []];
            this.isTrial = true;
            this.resetted = false;
            if (window.randomStreaming) {
                this.interval = setInterval(() => {
                    for (var t = 0; t < 5; t++) {
                        for (var c = 0; c < 4; c++) {
                            this.curTrial[c].push((Math.random() - 0.5) * 100);
                        }
                    }
                    this.timestepCallback(5);
                    if (this.curTrial[0].length >= 6.5 * EEG_FREQUENCY) {
                        this.streamSuccCallback(this.curTrial);
                    }
                }, this.ms);
            } else {
                this.bleStreaming.subscribe(
                    this.streamSuccCallback,
                    (err) => {
                        console.log(err);
                    },
                    this.timestepCallback
                );
            }
        },
        cancelTrial() {
            clearInterval(this.interval);
            this.isTrial = false;
            this.value = 0;
        },
    },
    computed: {
        info() {
            if (this.finetunedSession.idx != -1) {
                return "FINETUNED ON " + this.finetunedSession.name;
            } else {
                return "NETWORK PRETRAINED";
            }
        },
    },
    beforeDestroy() {
        clearInterval(this.interval);
    },
};
</script>

<style scoped>
.texttop {
    font-family: unquote("Roboto");
    font-size: 10;
    letter-spacing: 1.25px;
    margin-top: 10%;
    margin-bottom: 10%;
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

.topcenter {
    margin-top: 10%;
    margin-left: auto;
    margin-right: auto;
    width: 100%;
}
</style>
