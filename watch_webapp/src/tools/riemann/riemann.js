import riemannJs from "./Kernel";
import riemannWasm from "./Kernel.wasm";
/**
 * 
 * @param {Riemann} riemann 
 * @returns {EMetric[]}
 */
export function getAllMeanMetrics(riemann) {
    const arr = [riemann.EMetric.ALE, riemann.EMetric.Euclidian, riemann.EMetric.Harmonic, riemann.EMetric.Identity, riemann.EMetric.Kullback, riemann.EMetric.LogDet, riemann.EMetric.LogEuclidian, riemann.EMetric.Riemann, riemann.EMetric.Wasserstein];
    return arr
}


export var EMetric = {
    ALE: -1,
    Riemann: -1,
    Euclidian: -1,
    LogEuclidian: -1,
    LogDet: -1,
    Kullback: -1,
    Harmonic: -1,
    Wasserstein: -1,
    Identity: -1
}

var EMetricToString = {
    0: "",
    1: "",
    2: "",
    3: "",
    4: "",
    5: "",
    6: "",
    7: "",
    8: ""
}

const EMetrics = ["ALE",
    "Riemann",
    "Euclidian",
    "LogEuclidian",
    "LogDet",
    "Kullback",
    "Harmonic",
    "Wasserstein",
    "Identity"
]

/**
 * Implements the interface between the cpp riemann implementation and javascript.
 * 
 * Loads the wasm file with its corresponding .js and stores the kernel. 
 * Provides method to access cpp data.
 */
export class Riemann {
    kernel;
    constructor(instantiatedCallback, isWeb=true) {
        this.kernel = null;
        var vm = this;

        var instantiationConfig = {}
        if (isWeb) {
            instantiationConfig = {
                instantiateWasm(info, callback) {
                    WebAssembly.instantiate(riemannWasm, info).then((res) => {
                        console.log(res);
                        callback(res.instance, res.module);
                    });
                },
                locateFile(path) {
                    if (path.endsWith(".wasm")) {
                        return riemannWasm;
                        // return path;
                    }
                    return path;
                },
            }
        }


        this.EMetric = EMetric;
        this.EMetricToString = EMetricToString;

        var m = new riemannJs(instantiationConfig).then((mod => {
            vm.kernel = mod;

            for (const emetric of EMetrics) {
                vm.EMetricToString[vm._callEnum(emetric)] = emetric;
                vm.EMetric[emetric] = vm._callEnum(emetric);
            }
            instantiatedCallback(vm);
        }));
    }

    /**
     * @returns {number}
     */
    _callEnum(en) {
        if (this.kernel) {
            return this.kernel[en];
        } else {
            return null;
        }
    }

    /**
     * 
     * @returns {ArrayBuffer_d}
     */
    ArrayBuffer() {
        if (this.kernel) {
            return new this.kernel.ArrayBuffer_d();
        } else {
            return null;
        }
    }

    /**
     * 
     * @returns {DOMStringcpp}
     */
    DOMString() {
        if (this.kernel) {
            return new this.kernel.DOMStringcpp();
        } else {
            return null;
        }
    }

    /**
     * 
     * @param {ArrayBuffer_d} buffer 
     * @returns {Float64Array | Float32Array}
     */
    ArrayBufferToTypedArray(buffer) {
        if (this.kernel) {
            let ptr = this.kernel.getPointer(buffer.data);
            let size = buffer.get_length();
            let training_tensor_buffer = new Float64Array(this.kernel.HEAPU8.buffer, ptr, size);
            return training_tensor_buffer;
        } else {
            return null;
        }
    }

    /**
     * 
     * @returns {Timetensor_d}
     */
    Timetensor() {
        if (this.kernel) {
            return new this.kernel.Timetensor_d();
        } else {
            return null;
        }
    }

    /**
     * 
     * @param {Number} nChannels 
     * @param {Number} nBands 
     * @param {Number} sampleRate 
     * @param {Number} expectedTimesteps 
     * @returns {Timeseries_d}
     */
    Timeseries(nChannels, nBands, sampleRate, expectedTimesteps) {
        if (this.kernel) {
            return new this.kernel.Timeseries_d(nChannels, nBands, sampleRate, expectedTimesteps);
        } else {
            return null;
        }
    }


    /**
     * 
     * @param {number} numBands 
     * @returns {RiemannKernel_d}
     */
    RiemannKernel() {
        if (this.kernel) {
            return new this.kernel.RiemannKernel_d();
        } else {
            return null;
        }

    }



    printArrayBuffer() {
        if (this.kernel) {
            var i = this.kernel;
            var x = new i.ArrayBuffer_d(
                5,
                [1.0, 2.0, 3.0, 4.0, 5.0]
            );
            console.log(x.data);

            let ptr = i.getPointer(x.data);
            console.log("hollup");
            console.log(ptr);
            let size = x.get_length();
            // You can use Module['env']['memory'].buffer instead. They are the same.
            let my_uint8_buffer = new Float64Array(
                i.HEAPU8.buffer,
                ptr,
                size
            );

            console.log(my_uint8_buffer);
        }
    }

}









