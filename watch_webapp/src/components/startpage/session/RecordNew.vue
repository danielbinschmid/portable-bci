<template>
    <div id="record-new">
        <overlay-back-button @exit="exit()" />
        <div v-if="state == 'idle'">
            <simple-button @click="start()"> GO </simple-button>
        </div>
        <div v-else-if="state == 'prepare' || state == 'trial'">
            <v-progress-circular
                class="topcenter"
                :rotate="180"
                :size="100"
                :width="15"
                :value="uiValue"
                :color="state =='prepare' ? 'orange' : 'pink'"
            >
                {{ (uiValue * 6.5) / 100 + "s" }}
            </v-progress-circular>
            <div
                name="muse name"
                class="mdc-typography-styles-overline"
                :style="{ color: layout_data.GREY }"
            >
                {{ state == 'prepare' ? 'PREPARE' : 'IMAGINE' }}
            </div>
        </div>

        <div v-else-if="state == 'choose'">
            <div v-for="(item, i) in labels" :key="i">
                <simple-button @click="selectLabel(i)">
                    {{ item }}
                </simple-button>

            </div>
            <simple-button @click="discard()" bottomPadding> DISCARD </simple-button>
        </div>
    </div>
</template>



<script>
import SimpleButton from "@/components/ui-comps/SimpleButton.vue";
import OverlayBackButton from "@/components/ui-comps/OverlayBackButton.vue";
import { LAYOUT_DATA } from "@/data/layout_constraints"
import { MuseBLEStreaming } from "@/tools/ble/MuseBLEStreaming";
import { EEG_FREQUENCY } from "@/data/constants";
export default {
    components: { OverlayBackButton, SimpleButton },
    name: "RecordNew",
    data() {
        /** @type { MuseBLEStreaming } */
        var bleStreaming = undefined;
        if (this.museDevInfo) {
            bleStreaming = new MuseBLEStreaming(this.museDevInfo, 6.5);
        }
        return {
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
        museDevInfo: undefined
    },
    methods: {
        exit() {
            this.$emit("exit");
        },
        /**
         * @param {number[][]} timeseries
         */
        streamSuccCallback(timeseries) {
            const vm = this;
            this.bleStreaming.reset()
            this.bleStreaming.unsubscribe((suc) => {
                vm.state = "choose"
                vm.trialData = timeseries
                vm.value = 0;
                vm.uiValue = 0;
            }, (err) => {
                
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
        start() {
            this.state = "prepare";
            this.bleStreaming.subscribe(this.streamSuccCallback, (err) => {}, this.timestepCallback)
        },
        discard() {
            this.state = "idle";
        },
        selectLabel(labelIdx) {
            this.$emit("newTrial", this.trialData, labelIdx);
            this.state = "idle";
            this.$emit("exit")
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