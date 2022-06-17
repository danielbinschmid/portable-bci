import { FixedLinkedList } from "./FixedLinkedList"
import { reshape } from "mathjs";
export class CnnLstmPreprocessor {
    _dataCollectors;
    _collectedWindowsForChannels;
    _targetNumWindows;
    _numBands;
    _numChannels;
    /**
     * 
     * @param {number} targetNumWindows 
     * @param {number} shiftPerEmit 
     * @param {number} numBands 
     * @param {number} numChannels
     * @param {number} timestepsPerWindow 
     */
    constructor(targetNumWindows, numBands, numChannels, shiftPerEmit, timestepsPerWindow) {
        this._dataCollectors = []
        this._collectedWindowsForChannels = []
        this._numBands = numBands;
        this._numChannels = numChannels;
        for (var c = 0; c < numChannels; c++) {
            this._dataCollectors.push(new FixedLinkedList(shiftPerEmit, numBands, timestepsPerWindow));
            this._collectedWindowsForChannels.push([]);
            for (var b = 0; b < numBands; b++) {
                this._collectedWindowsForChannels[c].push([]);
            }
        }
        this._targetNumWindows = targetNumWindows;
    }

    /**
     * 
     * @param {number[]} bands
     * @param {number} index
     */
    addBand(bands, index) {
        const emit = this._dataCollectors[index].push(bands);
        if (emit != null && this._collectedWindowsForChannels[index][0].length < this._targetNumWindows) {
            for (var b = 0; b < this._numBands; b++) {
                this._collectedWindowsForChannels[index][b].push(emit[b]);
            }
        }
    }

    getTensor() {
        if (this._collectedWindowsForChannels.every((value, index, array) => {
            return value[0].length == this._targetNumWindows
        })) {
            const targetShape = []
            targetShape.push(1);
            targetShape.push(this._numBands * this._numChannels);
            targetShape.push(this._collectedWindowsForChannels[0][0].length);
            return [reshape(this._collectedWindowsForChannels, targetShape), targetShape];
        } else {
            return null;
        }
    }


}