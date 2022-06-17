<template>
    <div id="muse-interface">
        <muse-control/>
        <!-- <ble-view /> -->
        <v-btn @click="load()"> ok </v-btn>
        <v-btn @click="trye()"> test </v-btn>
        <v-btn @click="checkWebGL()"> check </v-btn>
        <v-btn @click="checkBackend()"> checkBackend </v-btn>
        <v-btn @click="loadjson()"> loadjson </v-btn>
        <v-btn @click="transfer_learning()"> transfer </v-btn>
        <v-btn @click="runBenchmarkRuntime()"> filteringRunTimes </v-btn>
        <div v-for="(log, index) in logs" :key="index">
            {{ log }}
        </div>
    </div>
</template>

<script>
import MuseControl from "./muse-components/MuseControl.vue";
import MuseVis from "./muse-components/MuseVis.vue";
import {Riemann} from "@/tools/riemann/riemann";
import { HdcHersche } from "@/tools/hdc/hdchersche";
import { prefilterMulitspectralHersche, initCoeffs } from "@/tools/scripts/bandpass";
import { EEGNet } from "@/tools/eegnet/load";
import { benchmarkMeanRuntimes } from "@/tools/evaluation/experiment_meanMetricRuntimes.js";
import { runBenchmarkFiltering } from "@/tools/evaluation/benchmarkFiltering";
function getChromeVersion () {     
    var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);

    return raw ? parseInt(raw[2], 10) : false;
}


export default {
    components: { MuseControl, MuseVis },
    name: "MuseInterface",
    data() {
        const EEGNetModel = new EEGNet();
        return {
            page: "visualize",
            pairedDevice: undefined,
            logs: [],
            EEGNetModel: EEGNetModel
        };
    },
    mounted() {
        this.EEGNetModel.init().then(() => {
            console.log("eegnet initialized");
        });
    },
    methods: {
        visualize(devInfo) {
            this.pairedDevice = devInfo;
            this.page = "visualize";
        },
        home() {},
        control() {
            this.page = "control";
        },
        loadjson() {
            this.EEGNetModel.warmUpPrediction();
            
        },
        async transfer_learning() {
            var vm = this;
            benchmarkMeanRuntimes(window.riemann, this).then(() => {
                vm.logs.push("execution finished");
            });
        },
        async runBenchmarkRuntime() {
            const runtime = runBenchmarkFiltering(4, 43, 250, 500, window.riemann);
            console.log(runtime);
        },
        webgl_detect(return_context) {
            if (!!window.WebGLRenderingContext) {
                var canvas = document.createElement("canvas"),
                    names = [
                        "webgl2",
                        "experimental-webgl2",
                        "webgl",
                        
                        "moz-webgl",
                        "webkit-3d",
                    ],
                    context = false;

                for (var i = 0; i < names.length; i++) {
                    try {
                        context = canvas.getContext(names[i]);
                        if (
                            context &&
                            typeof context.getParameter == "function"
                        ) {
                            // WebGL is enabled
                            if (return_context) {
                                // return WebGL object if the function's argument is present
                                return { name: names[i], gl: context };
                            }
                            // else, return just true
                            return true;
                        }
                    } catch (e) {}
                }

                // WebGL is supported, but disabled
                return false;
            }

            // WebGL not supported
            return false;
        },
        checkWebGL() {
            this.logs.push("is web gl supported: ");
            const answer = this.webgl_detect(true);
            this.logs.push(answer);
        },
        load () {
            var c = getChromeVersion();
            console.log(c);
            console.log("III aa");
            let vm = this;
            vm.logs.push("okok");
            vm.logs.push("mhm");
            new Riemann((copy) => {
                vm.logs.push("letsgo");
            }, vm.logs)
        },
        checkBackend() {
            var hdc = new HdcHersche(10, 10);
        },
        trye() {
            console.log("start")
            const allMeasures = [];
            const nBands = 16;
            const nChannels = 6;
            const coeffs = initCoeffs(nBands);
            var hdc = new HdcHersche(nBands, nChannels);
            const nSteps = 4 * 256;
            console.log("generating trials")
            hdc.genTrials();
            console.log("fitting to trials");
            // hdc._riemannKernel.fit()
            const fitMeasures = hdc.fit();
             
            allMeasures.push(fitMeasures);
            console.log("fitting done")
            const trialBands = window.riemann.FrequencyBands(nBands);
            const trialLabel = 1;
            // run through frequency bands
            var band = 0
            const trialData = [];
            for (let coeff of coeffs) {
                var bandData = [];

                for (var c = 0; c < nChannels; c++) {
                    var channelData = []
                    for (var t = 0; t < nSteps; t++) {
                        const x = Math.random() * 100 - 50;
                        channelData.push(x);
                    }
                    bandData.push(channelData);
                }
                
                trialData.push(bandData);
            }

            var now = Date.now();
            const predictionMeasures = {fBands: 0}
            // prefilter frequency bands 
            for (let coeff of coeffs) {
                var channelData = [];

                for (var c = 0; c < nChannels; c++) {
                    const bandData = prefilterMulitspectralHersche(trialData[band][c], 256, coeff.low+ 1, coeff.high);
                    channelData = channelData.concat(bandData);
                }
                // store data
                const bufferMatrix = window.riemann.BufferMatrix(channelData, nChannels, nSteps);
                trialBands.addBand(band, bufferMatrix);
                band++;
            }
            predictionMeasures.fBands = Date.now() - now;
            var now = Date.now();
            allMeasures.push(predictionMeasures);

            console.log("prediction trial generation done")
            var vm = this;
            hdc.predict(trialBands).then((tuple) => {
                const [result, measures] = tuple;
                console.log(result);
                allMeasures.push(measures);
            })
            console.log("prediction done");
            console.log(allMeasures);
        },
    },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.background {
    color: rgb(36, 36, 36);
}
h1,
h2 {
    font-weight: normal;
}
ul {
    list-style-type: none;
    padding: 0;
}
li {
    display: inline-block;
    margin: 0 10px;
}
a {
    color: #42b983;
}
</style>
