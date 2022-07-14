// ESM syntax is supported.
import { Riemann } from "./tools/riemann/riemann";

// import { evaluate } from "./evaluation/experiment_transferLogEucl";
//import { evaluate } from "./evaluation/experiments/experiment_hdcMuseMI";
import { evaluate } from "./evaluation/experiments/experiment_hdcRiemannCiM";
// import { evaluate } from "./evaluation/experiments/experiment_dimRanking_plusRiemann";
// import { evaluate } from "./evaluation/experiments/experiment_onlineCrossSessionAdaption";
// import { evaluate } from "./evaluation/experiments/experiment_onlineCrossSubjectAdaptionNaive";
// import { evaluate } from "./evaluation/experiments/experiments_RiemannMean.js/experiment_transfer";
import { testCiM } from "./tools/hdc/hdcCiMHrr";
// import { test } from "./evaluation/test_runs";
import { crossSubjectCrossSessionAccsPercentiles, crossSubjectCrossSessionAccs, crossSubjectAccsPercentiles, crossSubjectAccs,  sessionTransferRiemannEuclidianAccs, onlineCrossSubjectNaive, onlineCrossSessionAdaptionNoRiemannRefChangeAcc, onlineCrossSessionAdaptionAcc, meanMetricAccuracies, crossSessionMeanMetricAccuracies, transferBaselineAccs, riemannCiMAccs, hrrRetrainAcc, crossSubjectDataAugmentedRetrainingAccs } from "./evaluation/benchmarks/evaluateResults";
import { benchmarkMeanRuntimes } from "./webapp_port/experiment_meanMetricRuntimes";
import { init, warmUpPrediction } from "./webapp_port/test_deepconvnet";
import { cacheIV2a, loadCached } from "./evaluation/data_utils/readIV2a";
import { collectMuseMI } from "./evaluation/data_utils/readMuseMI";
import { exec } from "./webapp_port/experiment_edgeAdaption";


function printAccuracies(riemann) {
    console.log("Single session 3 fold cross validation:");
    meanMetricAccuracies();
    console.log("Cross session no transfer:");
    crossSessionMeanMetricAccuracies();
    console.log("Transfer session adaption:")
    transferBaselineAccs();
    // console.log("Riemann CiM Accs with Euclidian mean, no transfer cross session: ")
    // riemannCiMAccs();
    console.log("Riemann CiM with HRR and retraining:")
    hrrRetrainAcc();

    // console.log("crossSubjectDataAugmentedRetrainingAccs")
    // crossSubjectDataAugmentedRetrainingAccs();

    console.log("euclidian online transfer: ");
    sessionTransferRiemannEuclidianAccs();

    console.log("cross subject accs, percentile 0.2");
    crossSubjectAccs()

    console.log("cross subject percentiles")
    crossSubjectAccsPercentiles()

    console.log("cross subject and cross session")
    crossSubjectCrossSessionAccs()

    console.log("cross subject cross session percentiles")
    crossSubjectCrossSessionAccsPercentiles()
}

function crossSessionAdaptionAccs() {
    onlineCrossSessionAdaptionAcc()
    onlineCrossSessionAdaptionNoRiemannRefChangeAcc();
    onlineCrossSubjectNaive()
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
    evaluate(riemann);
    // benchmarkMeanRuntimes(riemann);
    // test(riemann);
    // printAccuracies()
    // cacheIV2a(riemann);
    // const a = loadCached(riemann);
    // console.log(a)
    // crossSessionAdaptionAccs();
    // exec()
}


function start() {
    const riemann = new Riemann(riemannInstantiatedCallback);
}


function main() {
    start();
}

main();