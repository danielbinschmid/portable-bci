<template>
    <div id="record-new">
        <overlay-back-button @exit="exit()" bottomPadding withText>
            REC NEW
        </overlay-back-button>
        <div v-if="state == 'idle'">
            <v-divider />
            <v-list-item>
                <div
                    class="mdc-typography-styles-overline"
                    :style="{
                        color: layout_data.GREY,
                    }"
                >
                    CHOOSE THOUGHT
                </div>
            </v-list-item>
            <v-divider />
            <div v-for="(item, i) in labels" :key="i">
                <simple-button @click="choose(i)">
                    {{ item }}
                </simple-button>
            </div>
        </div>
        <div v-else-if="state == 'prepare' || state == 'trial'">
            <div
                class="mdc-typography-styles-overline"
                :style="{
                    color: layout_data.GREY,
                }"
            >
                {{ "IMAGINE TO MOVE " + labels[chosenLabel] }}
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

        <div v-else-if="state == 'confirm'">
            <div
                class="mdc-typography-styles-overline2"
                :style="{
                    color: layout_data.GREY,
                }"
            >
                Recording done.
            </div>
            <div
                class="mdc-typography-styles-overline2"
                :style="{
                    color: layout_data.GREY,
                }"
            >
                Store recording?
            </div>
            <simple-button @click="confirm()"> KEEP </simple-button>
            <simple-button @click="discard()" bottomPadding>
                DISCARD
            </simple-button>
        </div>

        <bottom-padding />
    </div>
</template>



<script>
import BottomPadding from "@/components/ui-comps/BottomPadding.vue";
import SimpleButton from "@/components/ui-comps/SimpleButton.vue";
import OverlayBackButton from "@/components/ui-comps/OverlayBackButton.vue";
import { LAYOUT_DATA } from "@/data/layout_constraints";
import { MuseBLEStreaming } from "@/tools/ble/MuseBLEStreaming";
import { EEG_FREQUENCY } from "@/data/constants";
export default {
    components: { OverlayBackButton, SimpleButton, BottomPadding },
    name: "RecordNew",
    data() {
        /** @type { MuseBLEStreaming } */
        var bleStreaming = undefined;
        if (this.museDevInfo) {
            bleStreaming = new MuseBLEStreaming(this.museDevInfo, 6.5);
        }
        const ms = Math.floor(5000 / EEG_FREQUENCY);
        return {
            chosenLabel: -1,
            interval: {},
            ms: ms,
            curTrial: [[], [], [], []],
            bleStreaming: bleStreaming,
            layout_data: LAYOUT_DATA,
            labels: ["FEET", "RIGHT HAND", "LEFT HAND"],
            interval: {},
            state: "idle",
            value: 0,
            uiIter: 0,
            uiDelay: 20,
            uiValue: 0,
            trialData: null,
            logs: [],
        };
    },
    props: {
        museDevInfo: undefined,
    },
    methods: {
        exit() {
            this.$emit("exit");
        },
        /**
         * @param {number[][]} timeseries
         */
        streamSuccCallback(timeseries) {
            if (window.randomStreaming) {
                clearInterval(this.interval);
                this.state = "confirm";
                this.trialData = timeseries;
                this.value = 0;
                this.uiValue = 0;
            } else {
                const vm = this;
                this.bleStreaming.reset();
                this.bleStreaming.unsubscribe(
                    (suc) => {
                        vm.state = "choose";
                        vm.trialData = timeseries;
                        vm.value = 0;
                        vm.uiValue = 0;
                    },
                    (err) => {}
                );
            }
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

        start() {
            this.state = "prepare";
            if (window.randomStreaming) {
                this.curTrial = [[], [], [], []];
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
                    (err) => {},
                    this.timestepCallback
                );
            }
        },
        discard() {
            this.state = "idle";
            console.log(this.state);
            this.$emit("exit");
        },
        choose(idx) {
            this.chosenLabel = idx;
            this.start();
        },
        confirm() {
            this.state = "idle";
            this.$emit("newTrial", this.trialData, this.chosenLabel);
            this.$emit("exit");
        },
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
.mdc-typography-styles-overline2 {
    font-family: unquote("Roboto");
    font-size: 10;
    letter-spacing: 0.2px;
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