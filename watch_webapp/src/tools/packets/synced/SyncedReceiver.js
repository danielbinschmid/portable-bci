import { Timegrid } from "../Timegrid";
import { PacketNode } from "../PacketNode";
import { arange } from "../../evaluation/data_utils/array_utils";
export class SyncedReceiver {
    constructor(nChannels, frequency, packetSize) {
        this.timegrids = []
        this.offsets = []

        this.packetSize = packetSize;
        this.heads = [];
        this.firstIdx = -1;
        this.lastArrivals = [];
        this.lastEmit = -1;
        this.nChannels = nChannels;
        this.currentNodes = [];
        const now = Date.now()
        for (const c of arange(0, nChannels)) 
        { 
            
            this.timegrids[c] = new Timegrid(now, frequency / packetSize, 1000); 
            this.heads.push(new PacketNode([], null, 0));
            this.currentNodes.push(this.heads[c]);
            this.lastArrivals.push(-1);
        }
    }

    addPacket(packet, arrival, index) {
        if (packet.length != this.packetSize) { throw "length of BLE packet is not as expected." }

        var idx = this.timegrids[index].getTimegridPoint(arrival);
        if (this.lastArrivals[index] == -1) { 
            this.offsets[index] = idx; 
            this.lastArrivals[index] = 0;
        }
        if (idx - this.offsets[index] - this.lastArrivals[index] > 1) { throw "missing packet"; }

        this.lastArrivals[index] = idx - this.offsets[index];
        const node = new PacketNode(packet, null, packet.length);
        this.currentNodes[index].next = node;
        return this.emit();
    }

    /**
     * @return {number[][] | null} - of shape (nChannels, packetSize)
     */
    emit() {
        var i = Math.min(...this.lastArrivals);
        if (i > this.lastEmit) {
            if (i - this.lastEmit > 1) { throw "too many packets to simultaniously emit"; } 
            this.lastEmit = i;
            const emit = []
            for (const c of arange(0, this.nChannels)) {
                if (this.heads[c].next === null) { return null; }
                emit.push(this.heads[c].next.data);
                this.heads[c].next = this.heads[c].next.next;
            }
            return emit;
        } else {
            return null;
        }
    }
}