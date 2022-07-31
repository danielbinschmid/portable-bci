import { Timegrid } from "../Timegrid";
import { PacketNode } from "../PacketNode";
import { arange } from "../../evaluation/data_utils/array_utils";
export class SyncedReceiver {
    constructor(nChannels, frequency, packetSize) {
        this.timegrid = new Timegrid(Date.now(), frequency / packetSize); 
        this.packetSize = packetSize;
        this.heads = [];
        this.firstIdx = -1;
        this.lastArrivals = [];
        this.lastEmit = -1;
        for (const c of arange(0, nChannels)) 
        { 
            this.heads.push(new PacketNode([], null, 0));
            this.lastArrivals.push(-1);
        }
    }

    addPacket(packet, arrival, index) {
        if (packet.length != this.packetSize) { throw "length of BLE packet is not as expected." }

        var idx = this.timegrid.getTimegridPoint(arrival);
        if (this.firstIdx <= -1) { 
            this.firstIdx = idx; 
            this.lastArrivals[index] = idx - 1
        }
        if (this.firstIdx > -1 && this.lastArrivals[index] == -1) { 
            idx = this.firstIdx; 
            this.lastArrivals[index] = idx - 1
        }
        if (idx - this.lastArrivals[index] > 1) { throw "missing packet"; }

        this.lastArrivals[index] = idx; 

        const node = new PacketNode(packet, null, packet.length);
        this.heads[index].next = node;

        return this.emit();
    }

    /**
     * @return {number[][] | null} - of shape (nChannels, packetSize)
     */
    emit() {
        var i = Math.min(this.lastArrivals);
        if (i > this.lastEmit) {
            if (i - this.lastEmit > 1) { throw "too many packets to simultaniously emit"; } 
            this.lastEmit = i;
            const emit = []
            for (const c of arange(0, nChannels)) {
                emit.push(this.heads[c].next.data);
                this.heads[c].next = null;
            }
        } else {
            return null;
        }
    }
}