/**
 * HDC on reduced Muse MI dataset
 */
import { collectMuseMI } from "../data_utils/readMuseMI";
import { arange, shuffle, shuffle2, maxIdx } from "../data_utils/array_utils";
import { HdcHersche, Encodings } from "../../tools/hdc/hdchersche";


export async function evaluate(riemann) {
    const ts = riemann.Timeseries(4, 43, 250, 1000);
    const subjects = [2, 3, 4, 5]
    const nRuns = 10
    const accs = {}
    const shiftConfigs = [5.0, 10.0, 40.0]

    for (const s of shiftConfigs) {
        accs[s] = 0;
    }

    for (const run of arange(0, nRuns)) {
        console.log("RUN " + run)
        for (const shiftConfig of shiftConfigs) {
            for (const subj of subjects) {
                const data = collectMuseMI([subj], ts, riemann, [0, 9], shiftConfig); // [1, 2, 3, 4, 5, 6, 7, 8]
        
                shuffle2(data[subj].train_data, data[subj].train_labels);
                const train_data = data[subj].train_data;
                const train_labels = data[subj].train_labels;
        
                const hdc = new HdcHersche(43, 4, [0, 1], Encodings.THERMOMETER, { q: 2 * 393 }, riemann);
        
                for (const trialIdx of arange(0, train_data.length)) {
                    hdc.collectTrial(train_data[trialIdx], train_labels[trialIdx])
                }
        
                await hdc.fit();
        
                const test_data_ = collectMuseMI([subj], ts, riemann, [1, 2, 3, 4, 5, 6, 7, 8], 2.0);
                const test_data = test_data_[subj].train_data;
                const test_labels = test_data_[subj].train_labels;
                var nCorrectPreds = 0
                for (const trialIdx of arange(0, test_data.length)) {
                    // console.log(test_data[trialIdx])
                    const [pred, runtimes] = await hdc.predict(test_data[trialIdx]);
                    nCorrectPreds += maxIdx(pred) == test_labels[trialIdx]
                }
                console.log(nCorrectPreds / test_data.length)
                accs[shiftConfig] += (nCorrectPreds / test_data.length) / (nRuns * subjects.length); 
            }
        }
    }
    console.log(accs)
}