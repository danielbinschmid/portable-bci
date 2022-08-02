import { Timegrid } from "./Timegrid"
import { EmittingPacketList } from "./EmittingPacketList";

/**
 * Receives BLE packets and emits data with a given size in a given frequency.
 * 
 * Current implementation works with lazy loading on a linked list of BLE packets.
 * First, a received packet is linked within constant time. If the data is large enough for 
 * a new emit, packets are merged to an emit-package.
 * Runtime complexity is O(1) for adding packets and currently O(n) for fusing packets to an emit package.
 * Latter can be further optimized by returning an emit package iterator in O(1) instead of an array.
 */
export class PacketReceiver {
    /**
     * 
     * @param {number} frequency in Hz
     * @param {number} packetSize as number of values within a package
     * @param {number} emitSize as size of a package to emit
     * @param {number} emitFrequency in Hz
     */
    constructor(frequency, packetSize, emitSize, emitFrequency) {
        this.timegrid = new Timegrid(Date.now(), frequency / packetSize); 
        this.packetList = new EmittingPacketList(packetSize, emitSize, emitFrequency);
        this.lastReceivedIdx = 0;
        this.firstPacketPending = true;
    }

    /**
     * Resets the packet receiver
     */
    reset() {
        this.firstPacketPending = true;
        this.timegrid.reset();
    }

    /**
     * 
     * @param {number[]} data 
     * @param {number} arrival 
     * @returns {EmittingPacketList}
     */
    addPacket(data, arrival) {
        var emits = []
        const idx = this.timegrid.getTimegridPoint(arrival);
        if (this.firstPacketPending) {
            this.firstPacketPending = false;
            this.lastReceivedIdx = idx;
            emits = this.packetList.pushPacket(data, emits);
        } else {
            const numMissingPackets = idx - 1 - this.lastReceivedIdx;
            for(var i = 0; i < numMissingPackets; i++) {
                // push empty dummies to fill missing packets
                // emits = this.packetList.pushPacket([], emits)
            }
            emits = this.packetList.pushPacket(data, emits);
            this.lastReceivedIdx = idx;
        }
        return emits;
    }

    getIdx(arrival) {
        return this.timegrid.getTimegridPoint(arrival);
    }
}