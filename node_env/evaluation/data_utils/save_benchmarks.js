const fs = require('fs');
const benchmarkFolder = './evaluation/benchmarks/';




export function saveAsJSON(obj, name) {
    const currentMillis = "_" + Date.now().toString();
    let benchmarksStringified = JSON.stringify(obj);
    fs.writeFileSync(benchmarkFolder + name + currentMillis +  '.json', benchmarksStringified);
}