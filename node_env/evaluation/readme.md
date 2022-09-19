# NodeJs machine learning experiments
- `benchmarks` contains the evaluation results 
- `data_utils` contains method to preprocess or export data
- `experiments` contains the code for the experiments corresponding to the evaluation results. The original experiment code of each evaluation experiment is kept to facilitate reproducability.


## Experiment documentation
Make sure that the `evaluation/benchmarks/cache/` exist before re-running experiments

### EEGNet+HDC Hybrid
Contained in the `/cnn_hdc/` folder.
- `e_cnnhdcImmediateUse.js` - within-session evaluation.
- `e_cnnhdcPartialCrossSession.js` - cross-session evaluation with partial training sets.
- `e_cnnhdcRef.js` - cross-session evaluation with full training set.
### Dimension Ranking Optimization (DRO)
Contained in the `/dro/` folder.
- `e_dro_crossSubject.js` - Benchmarks the optimization algorithm
- `e_dro_plusRiemann.js` - Benchmarks the optimization algorithm with Riemannian transfer session adaption.
- `e_dro_plusRiemann_partialTraining.js` - Benchmark with Riemannian transfer session adaption and partial training sets.
- `e_dro.js` - Logs the accuracy when using bad or good dimensions only.

### Hersche HDC
Contained in the `/hersche/` folder.
- `e_hdcHersche.js` - cross-session evaluation
- `e_hdcHerschePartialCrossSession.js` - cross-session evaluation with partial training sets
- `e_hdcMuseMI.js` - evaluation script on reduced Muse MI dataset
- `e_onlineCrossSubjectAdaptionNaiveHersche.js` - cross-subject evaluation 
- `e_thermometerCrossSessionOnline.js` - within-session evaluation

### Riemann-CiM HDC
Contained in the `/riemann_cim/` folder.
- `e_hdcFHrrPartialTraining.js` - cross-session evaluation with partial training set with riemann-cim-fhrr
- `e_hdcRiemannCiM.js` - cross-session evaluation with full training set with riemann-cim-hrr
- `e_onlineCrossSessionAdaption.js` - cross-session evaluation with partial training set with riemann-cim-hrr
- `e_subjectIndependent.js` - cross-subject evaluation with riemann-cim-hrr

### Riemannian mean adaption
Contained in the `/riemann_mean/` folder.
- `e_meanMetricRuntimes.js` - logs run time of different Riemannian mean approximation algorithms.
- `e_meanMetrics3FoldCross.js` - 3-fold-cross within-session validation of mean metrics.
- `e_noTransfer.js` - cross-session evaluation without mean metric adaption.
- `e_transferBaseline.js` - cross-session offline evaluation with Riemannian transfer adaption

## Log results
The results of the experiments are located in the folder `/benchmarks/`. Navigate into the desired folder and print the accuracies via 
```s
node printResults.js
```