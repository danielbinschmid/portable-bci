<template>
    <div id="mind-reading">
        <v-list style="padding: 0" color="rgba(0, 0, 0, 0)">
            <overlay-back-button @exit="exit()" bottomPadding />
            <v-divider />
            <v-list-item>
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
            <v-divider />
            <v-list-item>
                <v-list-item-content>
                    <v-btn
                        class="center"
                        :color="layout_data.GREEN"
                        text
                        rounded
                        outlined
                        x-large
                        @click="startTrial()"
                        :disabled="!resetted"
                    >
                        Start Imagine
                    </v-btn>
                </v-list-item-content>
            </v-list-item>
        </v-list>
        <v-dialog v-model="isTrial" fullscreen>
            <v-card color="rgba(236, 239, 241, 0.95)">
                <overlay-back-button
                    @exit="cancelTrial()"
                    :bottomPadding="state != 'prepare' && state != 'trial'"
                />
                <div v-if="state == 'prepare' || state == 'trial'">
                    <v-progress-circular
                        class="topcenter"
                        :rotate="180"
                        :size="100"
                        :width="15"
                        :value="uiValue"
                        :color="state == 'prepare' ? 'orange' : 'pink'"
                    >
                        {{ (uiValue * 6.5) / 100 + "s" }}
                    </v-progress-circular>
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

                    <simple-button @click="startTrial()" :disabled="!resetted"> RETRY </simple-button>
                </div>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import OverlayBackButton from "@/components/ui-comps/OverlayBackButton.vue";
import SimpleButton from "@/components/ui-comps/SimpleButton.vue";
import { LAYOUT_DATA } from "@/data/layout_constraints";
import { BreedingRhombusSpinner } from "epic-spinners/dist/lib/epic-spinners.min.js";
import { MuseBLEStreaming } from "@/tools/ble/MuseBLEStreaming";
import { EEG_FREQUENCY } from "@/data/constants";
import { EEGNet} from "@/tools/eegnet/load";
import { resample2ndDim, slice2ndDim, maxIdx} from "@/tools/data_utils/array_utils"
export default {
    components: { BreedingRhombusSpinner, OverlayBackButton, SimpleButton },
    name: "MindReading",
    data() {
        /** @type { MuseBLEStreaming } */
        var bleStreaming = undefined;
        if (this.museDevInfo) {
            bleStreaming = new MuseBLEStreaming(this.museDevInfo, 6.5);
        }
        return {
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
            layout_data: LAYOUT_DATA,
            logs: [],
            resetted: true
        };
    },
    props: {
        museDevInfo: undefined,
        finetunedSession: undefined,
    },
    methods: {
        exit() {
            this.$emit("exit");
        },
        /**
         * @param {number[][]} timeseries
         */
        streamSuccCallback(timeseries) {
            this.state = "loading";
            const vm = this;
            this.bleStreaming.unsubscribe((result) => {
                vm.bleStreaming.reset();
                vm.resetted = true;
            }, (err) => {console.log(err)});
            this.bleStreaming.reset()
            this.value = 0;
            this.uiValue = 0;
            this.uiIter = 0;
            
            const targetFrequency = 128;
            const trial = resample2ndDim(targetFrequency * 4.0, slice2ndDim(2.5 * EEG_FREQUENCY, 6.5 * EEG_FREQUENCY, timeseries));

            /** @type {EEGNet} */
            const eegnet = window.eegnet
            if (eegnet === undefined) { 
                this.state = "idle"
                this.prediction = this.labels[0];
             }
            eegnet.prediction(trial).then((prediction) => {
                const labelIdx = maxIdx(prediction);
                this.prediction = this.labels[labelIdx];
                
                this.state = "idle"
            })

        },
        timestepCallback(nTimesteps) {
            this.value += (nTimesteps * 100) / (EEG_FREQUENCY * 6.5);
            this.uiIter += 1;
            if (this.uiIter % this.uiDelay == 0) {
                this.uiValue = Math.floor(this.value);
            }
            if (this.value > 35) { this.state = "trial"; }
        },
        startTrial() {
            this.state = "prepare";
            this.isTrial = true;
            this.resetted = false;
            this.bleStreaming.subscribe(this.streamSuccCallback, (err) => { console.log(err);}, this.timestepCallback);
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
