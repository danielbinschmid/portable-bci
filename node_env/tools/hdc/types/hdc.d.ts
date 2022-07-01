import { Tensor2D } from "@tensorflow/tfjs-node-gpu"

declare type SubjectMemoryQuery = {
    referenceAM: Tensor2D
}

declare type SubjectMemoryEntry = {
    id: String,
    entry: Tensor2D
}

declare type LabelTrials = {
    label: Number,
    trials: Tensor2D
}

declare type LabelSortedTrainingset = LabelTrials[]