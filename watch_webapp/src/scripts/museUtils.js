import { EEG_SERVICE, CONTROL_CHARACTERISTIC } from "../data/constants";
import { TextEncoder } from 'text-encoding';
import { Buffer } from 'buffer';
/***
 * address = The address/identifier provided by the scan's return object
service = The service's UUID
serviceIndex = When dealing with multiple services with the same UUID, this index will determine which service will be used (OPTIONAL)
characteristic = The characteristic's UUID
characteristicIndex = When dealing with multiple characteristics with the same UUID, this index will determine which chracteristic will be used (OPTIONAL)
value = Base64 encoded string
type = Set to "noResponse" to enable write without response, all other values will write normally.
 */

/**
 * 
 * @param {String} address 
 * @param {String} command 
 * @param {(result: BluetoothlePlugin.OperationResult) => void} writeSuccess 
 * @param {(error: BluetoothlePlugin.Error) => void} writeError 
 */
function sendCommand(command, address, writeSuccess, writeError) {
    window.bluetoothle.write(writeSuccess, writeError,
        {
            address: address, 
            service: EEG_SERVICE,
            characteristic: CONTROL_CHARACTERISTIC,
            value: encodeCommand(command),
            type: "noResponse"
        })

}

/**
 * 
 * @param {String} cmd 
 * @returns 
 */
function encodeCommand(cmd) {
    const encoded = new TextEncoder().encode(`X${cmd}\n`);
    encoded[0] = encoded.length - 1;
    return Buffer.from(encoded).toString('base64');
}

/**
 * PGB streaming: preset = 'p50'
 * EEG streaming: preset = 'p21'
 * extra AUX streaming: preset = 'p20'
 * @param {String} address 
 * @param {(result: BluetoothlePlugin.OperationResult) => void} writeSuccess 
 * @param {(error: BluetoothlePlugin.Error) => void} writeError 
 */
export function startRecording(address, writeSuccess, writeError, preset='p21') {
    // pause device
    sendCommand('h', address, writeSuccess, writeError)
    // preset device
    sendCommand(preset, address, writeSuccess, writeError)
    // (probably) start command
    sendCommand('s', address, writeSuccess, writeError)
    // resume command
    sendCommand('d', address, writeSuccess, writeError)
}

/**
 * @param {String} address 
 * @param {(result: BluetoothlePlugin.OperationResult) => void} writeSuccess 
 * @param {(error: BluetoothlePlugin.Error) => void} writeError 
 */
export function pauseRecording(address, writeSuccess, writeError) {
    sendCommand('h', address, writeSuccess, writeError)
}

/**
 * @param {String} address 
 * @param {(result: BluetoothlePlugin.OperationResult) => void} writeSuccess 
 * @param {(error: BluetoothlePlugin.Error) => void} writeError 
 */
export function resumeRecording(address, writeSuccess, writeError) {
    sendCommand('d', address, writeSuccess, writeError)
}


/**
 * 
 * @param {String} samples 
 * @returns 
 */
export function decodeEEGSamples(samples) {
    const u8 = new Uint8Array(Buffer.from(samples, 'base64')).subarray(2)
    return decodeUnsigned12BitData(u8).map((n) => 0.48828125 * (n - 0x800));
}

/**
 * 
 * @param {Uint8Array} samples 
 * @returns {number[]}
 */
function decodeUnsigned12BitData(samples) {
    const samples12Bit = [];
    // tslint:disable:no-bitwise
    for (let i = 0; i < samples.length; i++) {
        if (i % 3 === 0) {
            samples12Bit.push((samples[i] << 4) | (samples[i + 1] >> 4));
        } else {
            samples12Bit.push(((samples[i] & 0xf) << 8) | samples[i + 1]);
            i++;
        }
    }
    // tslint:enable:no-bitwise
    return samples12Bit;
}