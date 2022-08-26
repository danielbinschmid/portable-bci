<template>
    <div id="muse-raw-eeg-vis">
        <div v-for="(channel, index) in channels" :key="index">
            <v-list-item :style="smallSubHeader">
                <v-divider class="divider-style" />
                <v-subheader>
                    {{ channel }}
                </v-subheader>
                <v-divider class="divider-style" />
            </v-list-item>
            <dynamic-line-chart :currentVal="currentVals[index]" :minMaxRange="minMaxRange"/>
        </div>

        <div v-for="(log, index) in logs" :key="index">
            {{ log }}
        </div>
        <bottom-padding />
    </div>
</template>

<script>
import BottomPadding from "@/components/ui-comps/BottomPadding.vue";
import Vue from "vue";
import LineChart from "./LineChart.vue";
import DynamicLineChart from "./DynamicLineChart.vue";
import {
    CHANNEL_NAMES_EEG,
    EEG_CHARACTERISTICS,
    EEG_SERVICE,
    EEG_FREQUENCY,
    EEG_SAMPLES_PER_READING,
} from "@/data/constants";
import { decodeEEGSamples } from "@/scripts/museUtils";
export default {
    name: "MuseRawEegVis",
    components: {
        LineChart,
        DynamicLineChart,
        BottomPadding
    },
    props: {
        museDevInfo: undefined,
        minMaxRange: Number
    },
    data() {
        const now = Date.now();
        const currentVals = [];
        const lastTimestamps = [];
        for (let i = 0; i < 4; i++) {
            currentVals.push({ val: 0, timestamp: now });
            lastTimestamps.push(now);
        }
        return {
            logs: [],
            channels: CHANNEL_NAMES_EEG,
            h: 10,
            smallSubHeader: {
                minHeight: 0,
                height: 30 + "px",
            },
            currentVals: currentVals,
            eegService: EEG_SERVICE,
            lastTimestamps: lastTimestamps,
        };
    },
    methods: {
        newVal(val, index) {
            val.val = Math.sign(val.val) * Math.min(Math.abs(val.val), this.minMaxRange)
            Vue.set(this.currentVals, index, val);
        },
        errorCallback(err) {
            this.logs.push(err);
        },
        succCallbackFor(index, vm) {
            return function (result) {
                const readings = decodeEEGSamples(result.value);
                for (let i = 0; i < readings.length; i++) {
                    const time =
                        vm.lastTimestamps[index] +
                        (1.0 / EEG_FREQUENCY) * 1000 * i;
                    vm.newVal({ val: readings[i], timestamp: time }, index);
                }
                vm.lastTimestamps[index] +=
                    (1.0 / EEG_FREQUENCY) * 1000 * EEG_SAMPLES_PER_READING;
            };
        },
        startReading() {
            var index = 0;
            var vm = this;
            for (const characteristic of EEG_CHARACTERISTICS) {
                const successCallback = this.succCallbackFor(index, vm);
                window.bluetoothle.subscribe(
                    successCallback,
                    this.errorCallback,
                    {
                        address: this.museDevInfo.address,
                        service: this.eegService,
                        characteristic: characteristic,
                    }
                );
                index++;
            }
        },
    },
    mounted() {
        this.startReading();
    },
    destroyed() {
        for (const characteristic of EEG_CHARACTERISTICS) {
            window.bluetoothle.unsubscribe(
                (result) => {},
                (error) => {},
                {
                    address: this.museDevInfo.address,
                    service: this.eegService,
                    characteristic: characteristic,
                }
            );
        }
    }
};
</script>

<style scoped>
.divider-style {
    margin: 5%;
}
</style>