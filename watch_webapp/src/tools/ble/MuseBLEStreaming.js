import {
    CHANNEL_NAMES_EEG,
    EEG_CHARACTERISTICS,
    EEG_SERVICE,
    EEG_FREQUENCY,
    EEG_SAMPLES_PER_READING,
} from "@/data/constants";

import { decodeEEGSamples } from "@/scripts/museUtils";
import { SyncedReceiver } from "@/tools/packets/synced/SyncedReceiver";
export class MuseBLEStreaming {
    constructor(museDevInfo, trialSizeSeconds) {
        this.packetReceiver = new SyncedReceiver(4, EEG_FREQUENCY, EEG_SAMPLES_PER_READING);
        this.museDevInfo = museDevInfo;
    }

    /**
     * 
     * @param {*} index 
     * @param {MuseBLEStreaming} vm 
     * @returns 
     */
    packetReceivingCallbackForIndex(index, vm, succCallback) {
        return function (result) {
            const readings = decodeEEGSamples(result.value);
            const arrival = Date.now()
            
            const emit = vm.packetReceiver.addPacket(readings, arrival, index);
            if (emit != null) { succCallback(emit); }
        };
    }


    subscribe(succCallback, errorCallback, museDevInfo) {
        var index = 0;
        for (const characteristic of EEG_CHARACTERISTICS) {
            const successCallback = packetReceivingCallbackForIndex(index, vm, succCallback);
            window.bluetoothle.subscribe(
                successCallback,
                errorCallback,
                {
                    address: museDevInfo.address,
                    service: EEG_SERVICE,
                    characteristic: characteristic,
                }
            );
            index++;
        }
    }

    unsubscribe() {
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
}


