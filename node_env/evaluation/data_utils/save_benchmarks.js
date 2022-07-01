const fs = require('fs');
const benchmarkFolder = './evaluation/benchmarks/';




export function saveAsJSON(obj, name, folder=benchmarkFolder) {
    const currentMillis = "_" + Date.now().toString();
    let benchmarksStringified = JSON.stringify(obj);
    fs.writeFileSync(folder + name + currentMillis +  '.json', benchmarksStringified);
}