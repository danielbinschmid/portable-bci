import { PacketNode } from "./PacketNode"
import { interpolateArray } from "@/tools/scripts/interpolationUtils";


export class EmittingPacketList {
    _packetSize;
    _emitSize;
    _emitShift;
    constructor(packetSize, emitSize, emitShift) {
        this.head = new PacketNode(null, null, null);
        this.tail = this.head;
        this._packetSize = packetSize;
        this._emitSize = emitSize;
        this._emitShift = emitShift;
        this.length = 0;
    }

    pushPacket(data, emits) {
        let n = new PacketNode(data, null, this._packetSize);
        this.tail.next = n;
        this.tail = n;
        this.length += this._packetSize;
        emits = this._emit(emits);
        return emits;
    }

    clear() {
        this.head.next = null;
        this.tail = this.tail;
    }

    _emit(emits) {
        if (this.length > this._emitSize) {
            emits.push(this._getEmitArray());
            this._drop(this._emitShift);
            this.length = Math.max(0, this.length - this._emitShift);
            emits = this._emit(emits);
        }
        return emits;
    }

    _drop(amount) {
        const firstNode = this.head.next;
        if (firstNode != null) {
            const [leftToBeDiscarded, isEmpty] = firstNode.drop(amount);
            if (isEmpty) {
                this.head.next = firstNode.next;
                if (leftToBeDiscarded > 0) {
                    this._drop(leftToBeDiscarded);
                }
            }
        }
    }

    _getEmitArray() {
        let currentNode = this.head.next;
        var emitArray = [];
        var emitArraySize = 0;
        while (currentNode != null && emitArraySize <= this._emitSize) {
            let iter = currentNode.iterator();
            while (iter.hasNext() && emitArray.length < this._emitSize) {
                let val = iter.getNext();
                emitArray.push(val);
            }
            emitArraySize += currentNode.getSize();
            currentNode = currentNode.next;
        }
        // emitArray = emitArray.length < this._emitSize ? interpolateArray(emitArray, this._emitSize): emitArray;
        return emitArray;
    }
}