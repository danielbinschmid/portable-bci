# Title
This markdown document documents the benchmarks.
Last visited: 21.08.2022
author: Daniel Bin Schmid
Mail: danielbinschmid@outlook.de
All runs are on 4-channel subsets of the mentioned datasets. Feel free to contact for questions

# Benchmarks
## RiemannNet
### BCI IV2a dataset
Cross session evaluation: all_riemannNN.json
    - Trained on the training session of a target subject, benchmarked on the test session
    - 10 runs for both sessions
    - reproduce with rienannFNN/e_RiemannNet
Partial training, cross session evaluation: riemannNet_partialTraining.json
    - Partially trained on the training session, tested on the test session
    - reproduce with riemannFNN/e_RiemannNetPartialTraining.py

## EEGNet
### EPF dataset
Subject adaptive, subject independent, subject dependent: all_eegnet-3classMI_-1-2-3_20220605-112422.json
    - reproduce with eegnet/e_eegnet_epf.py

### BCI IV2a dataset
Supervised online session finetuning: all_crossSession_16$(..)$.json
    - 10 runs for both sessions.
    - Pretrained on all subjects except target, finetuned fully on target subject, finetuned partially on target session_
    - reproduce with eegnet/e_eegnet_edgeAdaptionCrossSession.py
Supervised online subject finetuning: all_crossSubject_20$(..)$.json
    - 10 runs for both sessions. 
    - Pretrained on all subjects except target, finetuned partially on target subject, tested on same session
    - reproduce with eegnet/e_eegnet_edgeAdaptionCrossSubject.py
Supervised offline subject finetuning: all_EEGNet.json
    - 10 runs for both sessions
    - Pretrained on all subjects except target, finetuned fully on target subject
    - reproduce with eegnet/e_eegnet_IV2a_naive_finetuning.py
Cross subject evaluation: all_eegnetCrossSubject.json
    - 10 runs for both sessions
    - Only pretrained on all subjects except target
    - reproduce with eegnet/e_eegnet_IV2a_DTL_naive.py
Layer constrained finetuning: all_EEGNetDTL.json
    - 4 runs for both sessions
    - Pretrained on all subjects except target, finetuned fully on target subject with the first layers frozen
    - reproduce with eegnet/e_eegnet_IV2a_layer_constrained_finetuning.py
Partial finetuning - all_EEGNetPartialFinetuning.json:
    - 6 runs for both sessions
    - Pretrained on all subjects except target, finetuned partially on target subject, evaluated cross session
    - reproduce with eegnet/e_eegnet_partialTrainingData.py
Naive finetuning versus training on all simultaniously versus subject individual
    - 10 runs but only on one session
    - script lost

### MuseMI
    - reproduce with eegnet/e_eegnet_museMI.py


## SVM & LDA
### BCI IV2a
Cross session evaluation: all_SVM-Riemann_baseline.json
    - Trained on training session, tested on test session
    - reproduce with svm_lda/e_SVM.py
Partial training, cross session evaluation: lda_svm_partialTraining.json
    - Trained partially on training session, tested on test session
    - reproduce with svm_lda/e_SVM_immediateUseOnlineAdaption.py

## DeepConvNet
Subject transfer learning: finetune_deepconvnet_50epochs_e-5lr.txt
    - reproduce with deepConvNet/e_deepConvNet_IV2a.py
