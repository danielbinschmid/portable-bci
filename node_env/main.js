// ESM syntax is supported.
import { Riemann } from "./tools/riemann/riemann";
import CNNHDC_withinsession from "./evaluation/experiments/cnn_hdc/e_cnnhdcImmediateUse";

/**
 * 
 * @param {Riemann} riemannInstance 
 */
function riemannInstantiatedCallback(riemannInstance) {
    const riemann = riemannInstance;
    
    // interactiveCommandPrompt(riemannInstance)
    // console.log("")
}

function interactiveCommandPrompt(wasmbackend) {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    const experiments = [
        {
            name: "EEGNet-HDC",
            folder_name: "cnn_hdc/",
            experiments: [
                {
                    name: "Within-session evaluation",
                    method: CNNHDC_withinsession
                },
                {
                    name: "Cross-session evaluation with full training set",
                    filename: "e_cnnhdcPartialCrossSession.js"
                },
                {
                    name: "Cross-session evaluation with partial training sets",
                    filename: "e_cnnhdcRef.js"
                }
            ]
        },
        {
            name: "Dimension Ranking Optimization",
        },
        {
            name: "Riemann embeddings by Hersche et al",
        },
        {
            name: "Riemann CiM embeddings",
        },
        {
            name: "Riemannian mean metrics benchmarks",
        }
    ]
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
            exp_.method();
        })


    })


}



function start() {
    const riemann = new Riemann(riemannInstantiatedCallback);
}


function main() {
    start();
}

main();