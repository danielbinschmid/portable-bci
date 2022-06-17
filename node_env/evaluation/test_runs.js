import d from "./data/IV2a/subj_1_all.json"
import { Riemann } from "../tools/riemann/riemann";
import tqdm from "ntqdm";
/**
 * 
 * @param {Riemann} riemann 
 */
export function test(riemann) {
    const train_data = d.train_data // of shape (nb_trials, nb_channels, nb_timesteps)
    const timeseries = riemann.Timeseries(4, 43, 250.0, 1000);
    const riemannKernel = riemann.RiemannKernel();

    console.log("instantiated timeseries and kernel object");
    console.log(riemannKernel.getCommaSeparatedMeanMetrics());
    // console.log(riemannKernel.getMeanMetric());
    riemannKernel.setMeanMetric(riemann.EMetric.ALE);
    console.log(riemann.EMetricToString[riemannKernel.getMeanMetric()]);
    riemannKernel.setMeanMetric(riemann.EMetric.Riemann);
    console.log(riemann.EMetricToString[riemannKernel.getMeanMetric()]);
    riemannKernel.setMeanMetric(riemann.EMetric.Euclidian);
    console.log(riemann.EMetricToString[riemannKernel.getMeanMetric()]);
    riemannKernel.setMeanMetric(riemann.EMetric.Wasserstein);
    console.log(riemann.EMetricToString[riemannKernel.getMeanMetric()]);

    for (const trial of tqdm(train_data, {logging: true})) {
        for (var t = 0; t < trial[0].length; t++) {
            const timestep = []
            for (var channelIdx = 0; channelIdx < trial.length; channelIdx++) {
                timestep.push(trial[channelIdx][t]);
            }
            timeseries.addTimestep(timestep);
        }
        const timetensor = riemann.Timetensor();
        timeseries.popAll(timetensor);
        
        riemannKernel.addTrial(timetensor);
    }

    /**
     * console.log("starting to fit");
    const buffer = riemann.ArrayBuffer();
    riemannKernel.fitTrials(buffer);
    console.log("converting array buffer");
    const array = riemann.ArrayBufferToTypedArray(buffer);

    console.log(riemannKernel.getMeanMetric());
    riemannKernel.setMeanMetric("Riemann");
    console.log(riemannKernel.getMeanMetric());
     */
    

    // console.log(array.length);
}