import { Riemann } from '../../tools/riemann/riemann';
import tqdm from "ntqdm"; // https://github.com/jhedin/ntqdm
import { arange, fill } from './array_utils';
const fs = require('fs');


const MuseDataFolter = './evaluation/data/museMI/';


/**
 * 
 * @param {*} trials 
 * @param {Timeseries_d} timeseries 
 * @param {*} nSteps  
 * @param {Riemann} riemann
 * @returns 
 */
 function get(trials, timeseries, nSteps, riemann) {
    const data = []

    for (const trialIdx of tqdm(arange(0, trials.length), { logging: true })) {
        const trial = trials[trialIdx];

        // get trial
        for (var t = 0; t < nSteps; t++) {
            const channelData = [];
            for (const channel of trial) { channelData.push(channel[t]); }
            timeseries.addTimestep(channelData);
        }
        let trialTensor = riemann.Timetensor();
        timeseries.popAll(trialTensor);
        data.push(trialTensor);
    }

    return data;
}



function resample(nb_timesteps, target_frequency, windowlength_seconds) {
    /**
     * def resample(nb_timesteps, target_frequency, windowlength_seconds):
    """
    data of shape (nb_trials, nb_channels, nb_timesteps)
    """
    target_nb_timesteps = int(target_frequency * windowlength_seconds)
    l = list(np.linspace(0, nb_timesteps - 1, target_nb_timesteps).astype(int))
    return l
     */
    throw "not implemented";
}

/**
 * 
 * @param {any[]} data 
 * @param {*} crop_session_range 
 * @param {*} frequency 
 * @param {*} shift 
 */
function cropTrial(data, crop_session_range, frequency=250, shift=6000) {
    // --------------- CONFIG ----------------
    const crop_size = crop_session_range * frequency;
    // data is of shape (n_channels, n_timesteps)
    const total_size = data[0].length;
    // ---------------- CROP ----------------
    var current_t = 0

    const trials = [];
    const labels = []
    while (current_t + crop_size < total_size) {
        const trial = [];
        for (var chIdx = 0; chIdx < data.length; chIdx++) {
            const channel = [] 
            for (var t = current_t; t < current_t + crop_size; t++) {
                channel.push(data[chIdx][t]);
            }
            trial.push(channel);
        }
        trials.push(trial);
        current_t += shift;
    }

    return trials;

}

/**
 * 
 * @param {number[][][]} data of shape (nTrials, nChannels, nTimesteps) 
 * @param {number[]} labels of shape (nTrials)
 * @param {number} nTrials 
 * @param {number} totalK 
 * @param {number} k 
 * @returns 
 */
function split(data, labels, nTrials, totalK, k) {
    const trialIndeces = arange(0, nTrials);
    // - get total number of timestep per label
    const totalTs = [0, 0]
    for (const trial of trials) {
        totalT[labels[trial]] += data[trial][0].length;
    }

    // - compute number of split timesteps pe
    const split = 1 / totalK; 
    const trainSplit = [Math.floor(totalTs[0] * split * 0.5), Math.floor(totalTs[1] * split * 0.5)];

    if (data[0].length != 4) { throw "assertion wrong"; }

    const train_data_all_trials = []
    const train_labels = []

    const before_benchmark_data_all_trials = []
    const before_benchmark_labels = []

    const after_benchmark_data_all_trials = []
    const after_benchmark_labels = []

    for (const trialIdx of trialIndeces) {
        const label = labels[trialIdx]
        var flags = {
            train: false,
            before: false,
            after: false
        }

        const train_data = []
        const before_benchmark_data = []
        const after_benchmark_data = []

        for (const chIdx = 0; chIdx < data[0].length; chIdx++) {
            const train_channel = []
            const before_benchmark_channel = []
            const after_benchmark_channel = []

            var current_ts = [0, 0];
            var isBefore = true;
            
            for (var t = 0; t < data[trialIdx][chIdx].length; t++) {
                if (current_ts[label] >= k * trainSplit[label] && current_ts[label] < (k + 1) * trainSplit[label]) {
                    train_channel.push(data[trialIdx][chIdx][t]);
                    flags.train = true;
                    isBefore = false;
                } else {
                    if (isBefore) {
                        flags.before = true;
                        before_benchmark_channel.push(data[trialIdx][chIdx][t]);
                    } else {
                        flags.after = true;
                        after_benchmark_channel.push(data[trialIdx][chIdx][t]);
                    }
                }
                current_ts[label] += 1;
            }

            before_benchmark_data.push(before_benchmark_channel)
            after_benchmark_data.push(after_benchmark_channel)
            train_data.push(train_channel)
        }

        if (flags.train) { 
            train_data_all_trials.push(train_data);
            train_labels.push(label);
        }
        if (flags.before) {
            before_benchmark_data_all_trials.push(before_benchmark_data);
            before_benchmark_labels.push(label);
        }
        if (flags.after) {
            after_benchmark_data_all_trials.push(after_benchmark_data);
            after_benchmark_labels.push(label);
        }
    }

    return {
        train_data: train_data_all_trials,
        train_labels: train_labels,
        before_data: before_benchmark_data_all_trials,
        before_labels: before_benchmark_labels,
        after_data: after_benchmark_data_all_trials,
        after_labels: after_labels 
    }
}


export function collectMuseMI(subjects, timeseries, riemann, trials= arange(0, 10)) {
    // ------------ CONFIG --------------
    const prefix = "subj_";
    const suffix = ".json";
    subjects = subjects;
    const trialPrefix = "trial_";
    const dataKey = "data";
    const labelKey = "label"; 
    const crop_size = 2.0;
    const frequency = 250;

    // ----------- LOAD DATA ------------
    const dataAll = {}

    for (const subject of subjects) {
        console.log("////// SUBJECT" + subject + " //////")
        let dataBuffer = fs.readFileSync(MuseDataFolter + prefix + subject + suffix);
        let data = JSON.parse(dataBuffer);
        var labels = [];
        var trialTensors = []
        for (const trialIdx of trials) {
            const trial = data[trialPrefix + trialIdx];
            var trialData = trial[dataKey];
            const label = trial[labelKey];

            var croppedTrial = cropTrial(trialData, crop_size);
            croppedTrial = get(croppedTrial, timeseries, crop_size * frequency, riemann);
            labels = labels.concat(fill(label, croppedTrial.length));
            trialTensors = trialTensors.concat(croppedTrial);
        }
        dataAll[subject] = {
            train_data: trialTensors,
            train_labels: labels,
            benchmark_data: [],
            benchmark_labels: []
        }
    }
    return dataAll;
}


