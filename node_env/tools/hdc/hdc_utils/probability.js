
/**
 * 
 * @returns {0 | 1}
 */
export function bernoulli() {
    var x = Math.random();
    if (x < 0.5) {
        return 0;
    } else {
        return 1;
    } 
}