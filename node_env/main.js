// ESM syntax is supported.
import { Riemann } from "./tools/riemann/riemann";
// import { evaluate } from "./evaluation/experiment_meanMetrics3FoldCross";
// import { evaluate } from "./evaluation/experiment_meanMetricRuntimes";
// import { evaluate } from "./evaluation/experiment_noCostMeans";
// import { evaluate } from "./evaluation/experiment_noTransfer";
// import { evaluate } from "./evaluation/experiment_transferBaseline";
import { evaluate } from "./evaluation/experiment_transferLogEucl";

import { test } from "./evaluation/test_runs";
import { meanMetricAccuracies, crossSessionMeanMetricAccuracies, transferBaselineAccs, transferEuclAccs } from "./evaluation/benchmarks/evaluateResults";
import { benchmarkMeanRuntimes } from "./webapp_port/experiment_meanMetricRuntimes";

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


function riemannInstantiatedCallback(riemannInstance) {
    const riemann = riemannInstance;

    evaluate(riemann);
    // benchmarkMeanRuntimes(riemann);
    // test(riemann);
    // printAccuracies()
}


function start() {
    const riemann = new Riemann(riemannInstantiatedCallback);
}


function main() {
    start();
}

main();