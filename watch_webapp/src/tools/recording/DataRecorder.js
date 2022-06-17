/**
 * Collects recorded data in Blob objects.
 * 
 */
export class DataRecorder {
    _data;
    _numChannels;
    _channelBlobs;

    /**
     * 
     * @param {number} numChannels 
     */
    constructor(numChannels) {
        this._numChannels = numChannels;
        this._resetData();
    }

    _resetData() {
        this._data = []
    }

    /**
     * 
     * @param {number[]} data 
     * @param {number} arrival
     * @param {number} channelIdx
     * @param {number} alignedIdx
     */
    addPacket(data, channelIdx, arrival, alignedIdx) {
        const jsonobj = {
            "data": data,
            "channelIdx": channelIdx,
            "arrival": arrival,
            "alignedIdx": alignedIdx
        }
        const objstring = JSON.stringify(jsonobj);
        const bytes = new TextEncoder().encode(objstring);
        const blob = new Blob([bytes], {
            type: "application/json;charset=utf-8"
        });
        this._data.push(blob);
    }

    clear() {
        this._resetData();
    }
    
    /**
     * @param {string} label
     * @returns {Blob}
     */
    toBlob(label) {
        const labelBlob = new Blob([label], { type: 'text/plain' });
        const dataBlob = new Blob(this._data);
        return new Blob([dataBlob, labelBlob]);
    }
}