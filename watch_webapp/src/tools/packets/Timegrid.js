export class Timegrid {
    _isFirst;
    /**
     * 
     * @param {number} instantiationTime 
     * @param {number} frequency 
     * @param {number} patience 
     */
    constructor(instantiationTime, frequency, patience=20) {
        this.offset = 0;
        this.frequency = frequency;
        this.stepSize =   (1 / frequency) * (10 ** 3); 
        this.lastArrival = instantiationTime;
        this.patienceMilli = this.stepSize * patience;
        this._isFirst = true;
    }

    reset() {
        this._isFirst = true;
    }

    /**
     * Arrival is interpreted as the recording timepoint in milliseconds of the last element in the package
     * 
     * 
     * @param {number} arrival 
     * @returns the index of the arrival time
     */
    getTimegridPoint(arrival) {
        if (this._isFirst) {
            this.lastArrival = arrival - this.stepSize;
            this._isFirst = false
        }
        const arrivalOffset = arrival - this.lastArrival - this.stepSize;
        if (arrivalOffset <= this.patienceMilli) {
            // if arrival offset within patience threshhold, interpret as delayed package
            this.offset += 1;
            this.lastArrival += this.stepSize;
            return this.offset;
        } else {
            // if arrival offset beyond patience, interpret as missing package
            const arrivalOffsetIdx = Math.floor((arrivalOffset) / this.stepSize) + 1;
            this.offset += arrivalOffsetIdx;
            this.lastArrival += arrivalOffsetIdx * this.stepSize;  
            return this.offset;
        } 
    }
} 