export class PacketNodeIterator {
    _current;
    _data;
    _size;
    /**
     * 
     * @param {number[]} data 
     * @param {number} numDiscarded 
     */
    constructor(data, numDiscarded) {
        this._current = numDiscarded - 1;
        this._data = data;
        this._size = data.length;
    }

    hasNext() {
        return this._current < this._size - 1;
    }

    getNext() {
        this._current += 1;
        return this._data[this._current];
    }
}