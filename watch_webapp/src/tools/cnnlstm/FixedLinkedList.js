import { LinkedListNode } from "./LinkedListNode";

export class FixedLinkedList {
    _head;
    _tail;
    _length;
    _zeroSumArray;
    _sumCache;
    _previousTail;
    _lastNthNode;
    _numWindowsPerEmit;
    /**
     * 
     * @param {number} shiftPerEmit 
     * @param {number} numBands
     */
    constructor(shiftPerEmit, numBands, numWindowsPerEmit) {
        this._head = new LinkedListNode(null, null, null);
        this._tail = this._head;
        this._length = 0;
        this.n = shiftPerEmit;
        (this._sumCache = []).length = numBands; 
        this._sumCache.fill(0);
        this._previousTail = this._head;
        this._lastNthNode = this._head;
        this._numWindowsPerEmit = numWindowsPerEmit;
    }

    /**
     * 
     * @returns {number[]}
     */
    emitAverage() {
        const sum = this._previousTail.next.add(this._sumCache);
        this._sumCache = sum;
        this._previousTail = this._tail;
        const average = sum.map((value, index, array) => {
            return value / this._length;
        });

        const nthNext = this._head.nthNext;
        this._sumCache = this._sumCache.map((value, index, array) => {
            return value - nthNext.sumCache[index]
        });

        // shift the array n-times forwards
        this._head.next = nthNext.next;
        this._head.nthNext = nthNext.nthNext;
        this._length -= this.n;

        return average;
    }

    /**
     * 
     * @param {number[]} data 
     * @returns {number[] | null}
     */
    push(data) {
        this._length += 1;
        const n = new LinkedListNode(data, null, null);
        this._tail.next = n;
        this._tail = n;
        if (this._length % this.n) {
            this._lastNthNode.nthNext = n;
            this._lastNthNode = n;
        }
        var avrg = null;
        if (this._length >= this._numWindowsPerEmit) {
            avrg = this.emitAverage();
        }
        return avrg
    }





}