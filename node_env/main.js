// ESM syntax is supported.
import { Riemann } from "./tools/riemann/riemann";
import { experiments } from "./evaluation/experiment_metadata"
// 
/**
 * 
 * @param {Riemann} riemannInstance 
 */
function riemannInstantiatedCallback(riemannInstance) {
    const riemann = riemannInstance;

    interactiveCommandPrompt(riemannInstance)
}

function interactiveCommandPrompt(wasmbackend) {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    for (var i = 0; i < experiments.length; i++) {
        const exp = experiments[i]
        console.log("Press " + i + " for " + exp.name)
    }

    rl.question('What experiment do you choose? ', function (id) {
        const exp = experiments[id]
        console.log(exp.name + " is chosen")
        for (var j = 0; j < exp.experiments.length; j++) {
            const exp_ = exp.experiments[j]
            console.log("Press " + j + " for " + exp_.name)
        }
        rl.question("What experiment shall be executed?", function (expID) {
            const exp_ = exp.experiments[expID];
            exp_.method(wasmbackend);
        });
    });
}



function start() {
    const riemann = new Riemann(riemannInstantiatedCallback);
}


function main() {
    start();
}

main();