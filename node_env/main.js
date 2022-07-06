// ESM syntax is supported.
import { Riemann } from "./tools/riemann/riemann";

// import { evaluate } from "./evaluation/experiment_transferLogEucl";
// import { evaluate } from "./evaluation/experiments/experiment_hdcMuseMI";
// import { evaluate, analyzeQuantization } from "./evaluation/experiments/experiment_hdcRiemannCiM";
import { evaluate } from "./evaluation/experiments/experiment_onlineCrossSessionAdaption";
import { testCiM } from "./tools/hdc/hdcCiMHrr";
// import { test } from "./evaluation/test_runs";
import { onlineCrossSessionAdaptionAcc, meanMetricAccuracies, crossSessionMeanMetricAccuracies, transferBaselineAccs, transferEuclAccs, riemannCiMAccs, hrrRetrainAcc, crossSubjectDataAugmentedRetrainingAccs } from "./evaluation/benchmarks/evaluateResults";
import { benchmarkMeanRuntimes } from "./webapp_port/experiment_meanMetricRuntimes";
import { init, warmUpPrediction } from "./webapp_port/test_deepconvnet";
import { cacheIV2a, loadCached } from "./evaluation/data_utils/readIV2a";
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
    // console.log("Riemann CiM Accs with Euclidian mean, no transfer cross session: ")
    // riemannCiMAccs();
    console.log("Riemann CiM with HRR and retraining:")
    hrrRetrainAcc();

    console.log("crossSubjectDataAugmentedRetrainingAccs")
    crossSubjectDataAugmentedRetrainingAccs();
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

    // analyzeQuantization(riemann);
    // testCiM()
    // testCosDist()
    // onlineCrossSessionAdaptionAcc()
    evaluate(riemann);
    // benchmarkMeanRuntimes(riemann);
    // test(riemann);
    // printAccuracies()
    // cacheIV2a(riemann);
    // const a = loadCached(riemann);
    // console.log(a)
}


function start() {
    const riemann = new Riemann(riemannInstantiatedCallback);
}


function main() {
    start();
}

main();