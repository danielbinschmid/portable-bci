export class LinkedListNode {
    next;
    values;
    sumCache;
    nthNext;
    /**
     * 
     * @param {number[]} values 
     * @param {LinkedListNode} next 
     * @param {LinkedListNode} nthNext
     */
    constructor(values, next, nthNext) {
        this.next = next;
        this.values = values;
        this.sumCache = [];
        this.nthNext = nthNext;
    }

    /**
     * 
     * @param {number[]} prevVals 
     * @returns {number[]}
     */
    add(prevVals) {
        const sum = this.values.map((value, index, array) => {
            return value + prevVals[index]
        });
        this.sumCache = sum;
        if (this.next != null) {
            return this.next.add(sum);
        } else {
            return sum;
        }
    }
}