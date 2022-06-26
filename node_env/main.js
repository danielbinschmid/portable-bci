// ESM syntax is supported.
import { Riemann } from "./tools/riemann/riemann";

// import { evaluate } from "./evaluation/experiment_transferLogEucl";
// import { evaluate } from "./evaluation/experiments/experiment_hdcMuseMI";
import { evaluate } from "./evaluation/experiments/experiment_hdcRiemannCiM";
// import { test } from "./evaluation/test_runs";
import { meanMetricAccuracies, crossSessionMeanMetricAccuracies, transferBaselineAccs, transferEuclAccs } from "./evaluation/benchmarks/evaluateResults";
import { benchmarkMeanRuntimes } from "./webapp_port/experiment_meanMetricRuntimes";
import { init, warmUpPrediction } from "./webapp_port/test_deepconvnet";

import { collectMuseMI } from "./evaluation/data_utils/readMuseMI";



function printAccuracies(riemann) {
    console.log("Single session 3 fold cross validation:");
    meanMetricAccuracies();
    console.log("Cross session no transfer:");
    crossSessionMeanMetricAccuracies();
    console.log("Transfer session adaption:")
    transferBaselineAccs();
    console.log("Euclidian mean online cross session: ")
    transferEuclAccs();
}

function test_deepconvnet() {
    init().then((model) => {
        warmUpPrediction(model).then((number) =>
        warmUpPrediction(model));
    })
}

/**
 * 
 * @param {Riemann} riemannInstance 
 */
function riemannInstantiatedCallback(riemannInstance) {
    const riemann = riemannInstance;
    // evaluate(riemann);
    // evaluate(riemann)
    // evaluate(riemann);
    // benchmarkMeanRuntimes(riemann);
    // test(riemann);
    printAccuracies()
    
}


function start() {
    const riemann = new Riemann(riemannInstantiatedCallback);
}


function main() {
    start();
}

main();