import {
    CHANNEL_NAMES_EEG,
    EEG_CHARACTERISTICS,
    EEG_SERVICE,
    EEG_FREQUENCY,
    EEG_SAMPLES_PER_READING,
} from "@/data/constants";

import { decodeEEGSamples } from "@/scripts/museUtils";
import { PacketReceiver } from "@/tools/packets/PacketReceiver";
import { arange } from "../evaluation/data_utils/array_utils";


export class EmittingStreaming {
    constructor(museDevInfo, timestepsPerEmit) {
        this.receivers = []
        const nChannels = 4
        this.nChannels = nChannels;
        for (const c of arange(0, nChannels)) {
            this.receivers.push(new PacketReceiver(EEG_FREQUENCY, EEG_SAMPLES_PER_READING, EEG_FREQUENCY, timestepsPerEmit));
        }
        this.museDevInfo = museDevInfo;
        
    }

    /**
     * 
     * @param {*} index 
     * @param {EmittingStreaming} vm 
     */
    packetReceivingCallbackForIndex(index, vm, succCallback) {
        return function (result) {
            if (!this.success) {
                const readings = decodeEEGSamples(result.value);
                const arrival = Date.now();

                const emit = vm.receivers[index].addPacket(readings, arrival);
                if (emit != null) {
                    succCallback(emit, index);
                }
            }
            return null;
        };
    }


    subscribe(succCallback, errorCallback) {
        var index = 0;
        const vm = this;
        for (const characteristic of EEG_CHARACTERISTICS) {
            const successCallback = this.packetReceivingCallbackForIndex(index, vm, succCallback);
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