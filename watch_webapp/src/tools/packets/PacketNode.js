import { PacketNodeIterator } from "./PacketNodeIterator";
export class PacketNode {
    _numDiscarded;
    _packetSize;
    /**
     * 
     * @param {number[]} data 
     * @param {PacketNode} next 
     * @param {number} packetSize 
     */
    constructor(data, next, packetSize) {
        this.data = data;
        this.next = next;
        this._numDiscarded = 0;
        this._packetSize = packetSize;
    }

    /**
     * @param {number} amount - amount of data to be discarded
     * @returns amount of elements left to be discarded
     */
    drop(amount) {
        this._numDiscarded += amount;
        return [Math.max(0, this._numDiscarded - this._packetSize), this._numDiscarded >= this._packetSize];
    }

    getSize() {
        return this._packetSize - this._numDiscarded;
    }

    iterator() {
        return new PacketNodeIterator(this.data, this._numDiscarded);
    }
}