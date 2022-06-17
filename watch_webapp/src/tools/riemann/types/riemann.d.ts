declare type ArrayBuffer_d = {
    length: Number,
    data: any,
}

declare type Timetensor_d = {
    length: Number,
    nChannels: Number,
    isCov: boolean
}

declare type EMetric = {
    ALE: Number,
    Riemann: Number,
    Euclidian: Number,
    LogEuclidian: Number,
    LogDet: Number,
    Kullback: Number,
    Harmonic: Number,
    Wasserstein: Number,
    Identity: Number
}

declare type Timeseries_d = {
    addTimestep: (arg0: Number[]) => void,
    getLength: () => Number,
    clear: () => void,
    popAll: (result: Timetensor_d) => Timetensor_d,
    popN: (arg0: Numberm, result: Timetensor_d) => Timetensor_d,
    getNLastSteps: (arg0: Number, result: Timetensor_d) => Timetensor_d
}

declare type RiemannKernel_d = {
    addTrial: (arg0: Timetensor_d) => void,
    addBreak: (arg0: Timetensor_d) => void,
    getMeanMetric: () => EMetric, 
    getCommaSeparatedMeanMetrics: () => String,
    setMeanMetric: (arg0: EMetric) => String,
    fitTrials: (result: ArrayBuffer_d) => ArrayBuffer_d,
    fitBreaks: () => void,
    reset: () => void,
    apply: (arg0: Timetensor_d, result: ArrayBuffer_d) => ArrayBuffer_d
} 
