import {
    CHANNEL_NAMES_EEG,
    EEG_CHARACTERISTICS,
    EEG_SERVICE,
    EEG_FREQUENCY,
    EEG_SAMPLES_PER_READING,
} from "@/data/constants";

import { decodeEEGSamples } from "@/scripts/museUtils";
import { SyncedReceiver } from "@/tools/packets/synced/SyncedReceiver";
import { arange } from "../evaluation/data_utils/array_utils";
export class MuseBLEStreaming {
    constructor(museDevInfo, trialSizeSeconds) {
        this.nChannels = 4;
        this.packetReceiver = new SyncedReceiver(this.nChannels, EEG_FREQUENCY, EEG_SAMPLES_PER_READING);
        this.museDevInfo = museDevInfo;
        this.curTrial = [[], [], [], []];
        this.trialSteps = trialSizeSeconds * EEG_FREQUENCY;
        this.success = false;
    }

    reset() {
        this.success = false;
        this.curTrial = [[], [], [], []]
        this.packetReceiver = new SyncedReceiver(this.nChannels, EEG_FREQUENCY, EEG_SAMPLES_PER_READING);
    }

    /**
     * 
     * @param {*} index 
     * @param {MuseBLEStreaming} vm 
     */
    packetReceivingCallbackForIndex(index, vm, succCallback, fullTimestepCallback) {
        return function (result) {
            if (!this.success) {
                const readings = decodeEEGSamples(result.value);
                const arrival = Date.now()

                const emit = vm.packetReceiver.addPacket(readings, arrival, index);
                if (emit != null) {
                    fullTimestepCallback(EEG_SAMPLES_PER_READING);
                    for (const c of arange(0, vm.nChannels)) {
                        vm.curTrial[c].push(...emit[c]);
                    }
                    if (vm.curTrial[0].length >= vm.trialSteps) {
                        this.success = true;
                        succCallback(vm.curTrial);
                    }
                }
            }
        };
    }


    subscribe(succCallback, errorCallback, fullTimestepCallback) {
        var index = 0;
        const vm = this;
        for (const characteristic of EEG_CHARACTERISTICS) {
            const successCallback = this.packetReceivingCallbackForIndex(index, vm, succCallback, fullTimestepCallback);
            window.bluetoothle.subscribe(
                successCallback,
                errorCallback,
                {
                    address: this.museDevInfo.address,
                    service: EEG_SERVICE,
                    characteristic: characteristic,
                }
            );
            index++;
        }
    }

    unsubscribe(succCallback, errorCallback) {
        for (const characteristic of EEG_CHARACTERISTICS) {
            window.bluetoothle.unsubscribe(
                succCallback,
                errorCallback,
                {
                    address: this.museDevInfo.address,
                    service: EEG_SERVICE,
                    characteristic: characteristic,
                }
            );
        }
    }
}


