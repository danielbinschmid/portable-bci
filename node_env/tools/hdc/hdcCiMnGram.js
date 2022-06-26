import * as tf from '@tensorflow/tfjs-node-gpu';
// import '@tensorflow/tfjs-backend-wasm';
// import { randomUniformVariable } from '@tensorflow/tfjs-layers/dist/variables';

import { maxIdx } from '../../evaluation/data_utils/array_utils';

import { Riemann } from "../riemann/riemann";
// declare var riemann: Riemann;

export class HdcCiMnGram {
    _hdDim;
    _nBands;
    _nChannels;
    _iMBands;
    _iMTSpace;
    _nTSpaceDims;
    _riemann;
    _riemannKernel;
    _nTrials;
    _qLevel;
    _CiMEmbedding;
    _trialLabels;
    _classLabels;
    _AM;

    /**
     * 
     * @param {*} nBands 
     * @param {*} nChannels 
     * @param {*} dim 
     * @param {Riemann} riemann 
     */
    constructor(nBands, nChannels, dim, riemann, classLabels=[0, 1, 2]) {
        this._hdDim = dim;
        this._nBands = nBands;
        this._nChannels = nChannels;
        this._nTSpaceDims = (nChannels * (nChannels + 1)) / 2;
        // gen. item memory for bands and channels 
        [this._iMBands, this._iMTSpace] = this._genItemMemory();
        this._riemann = riemann;
        this._riemannKernel = riemann.RiemannKernel();
        this._nTrials = 0;
        this._qLevel = 100;
        this._genCiM();
        this._trialLabels = [];
        this._classLabels = classLabels;
    }

    /**
     * Generates HDC item memory.
     * @returns {tf.Tensor3D[]} - of shape (nFrequencyBands, hdDim)
     */
     _genItemMemory() {
        const iMBands = tf.rand([this._nBands, this._hdDim], this._bernoulli, 'bool');
        const iMTSpace = tf.rand([this._nTSpaceDims, this._hdDim], this._bernoulli, 'bool');
        return [iMBands, iMTSpace];
    }

    _genCiM() {
        // create random init vector
        const Levels = []
        const L0 = []
        for (var i = 0; i < this._hdDim; i++) {
            L0.push(this._bernoulli());
        }
        Levels.push(L0);

        var currentLevel = [...L0];

        for (var q = 0; q < this._qLevel - 1; q++) {
            const indeces = []
            for (var i = 0; i < this._hdDim / (this._qLevel - 1); i++) {
                var idx = Math.floor((Math.random() * this._hdDim));
                while (indeces.findIndex((val, ind, arr) => { ind == idx }) != -1) { idx = Math.floor((Math.random() * this._hdDim)); }
                indeces.push(idx);
            }

            for (const idx of indeces) {
                currentLevel[idx] = currentLevel[idx] == false; 
            }

            var currentLevelCopy = [...currentLevel];
            Levels.push(currentLevelCopy);
        }

        const CiM = tf.tensor2d(Levels, [this._qLevel, this._hdDim]);

        const embedding = tf.layers.embedding({
            inputDim: this._qLevel,
            outputDim: this._hdDim,
            trainable: false,
            weights: [CiM]
        })

        this._CiMEmbedding = embedding;
    }


    /**
     * 
     * @param {Timetensor_d} timetensor 
     */
    addTrial(timetensor, label) {
        this._riemannKernel.addTrial(timetensor);
        this._nTrials += 1;
        this._trialLabels.push(label);
    }

    /**
     * 
     * @param {tf.Tensor3D} trialTensor shape (nBands, nTSpaceDim, hdDim)
     */
    _encodeTSpacedim(trialTensor) {
        const vm = this;
        const t = tf.tidy(() => {
            const shifted = [];
            for (var Tidx = 0; Tidx < this._nTSpaceDims; Tidx++) {
                var tSpaceDim = trialTensor.gather(tf.tensor1d([Tidx], 'int32'), 1);
                const part1 = tSpaceDim.slice([0, 0, Tidx], [this._nBands, 1, this._hdDim - Tidx]);
                const part2 = tSpaceDim.slice([0, 0, 0], [this._nBands, 1, Tidx]);
                tSpaceDim = part1.concat(part2, 2);
                shifted.push(tSpaceDim)
            }
            var trialTensor_ = tf.concat(shifted, 1);
            // multiply vecs
            const bandTensors = trialTensor_.unstack();
            const bandTensorsNew = [];
            for (const bandTensor of bandTensors) {
                const nTSpaceVecs = bandTensor.unstack();
                var currentVec = nTSpaceVecs[0];

                
                for (var i = 1; i < nTSpaceVecs.length; i++) {
                    currentVec = currentVec.logicalXor(nTSpaceVecs[i]);
                }
                bandTensorsNew.push(currentVec);
            }
            trialTensor_ = tf.stack(bandTensorsNew);

            return trialTensor_;
        })
        return t;
    }

    /**
     * 
     * @param {tf.Tensor2D} trialTensor 
     */
    _encodeBands(trialTensor) {
        const vm = this;
        const t = tf.tidy(()=> {
            var trialTensor_ = trialTensor.logicalXor(vm._iMBands);
            trialTensor_ =  trialTensor_.toInt();
            trialTensor_ = trialTensor_.sum(0); // result: (nBands, hdDim)

            const threshholdBands = Math.floor(vm._nBands / 2);
            const threshholdTensorBands = tf.scalar(threshholdBands);
            trialTensor_ = trialTensor_.clipByValue(threshholdBands, threshholdBands + 1).sub(threshholdTensorBands).toBool();
            return trialTensor_;
        });
        return t;
    }
    
    /**
     * 
     */
    encodeBatch(batchBuffer, nTrials) {
        batchBuffer = this._riemann.ArrayBufferToTypedArray(batchBuffer); // of shape (nTrials, nBands, nFeats)
        batchBuffer = new Float32Array(batchBuffer);
       
        const vm = this;
       
        const batchTensor = tf.tidy(() => {
            var trainTensor = tf.tensor3d(batchBuffer, [nTrials, vm._nBands, vm._nTSpaceDims]);
            // int( (x - mean) * (q / sigma) + (q - 1) / 2) )

            // moments
            const moments = tf.moments(trainTensor, 2);
            const std = moments.variance.sqrt();
            const sigma = std.mul(tf.scalar(3)).reshape([nTrials, vm._nBands, 1]).tile([1, 1, vm._nTSpaceDims]);
            const means = moments.mean.reshape([nTrials, vm._nBands, 1]).tile([1, 1, vm._nTSpaceDims]);

            // int( (x - mean) * (q / sigma) + (q - 1) / 2) )
            trainTensor = trainTensor.sub(means);   
            trainTensor = trainTensor.div(sigma); 
            trainTensor = trainTensor.mul(tf.scalar(vm._qLevel));
            trainTensor = trainTensor.add(tf.scalar((vm._qLevel - 1) / 2)).toInt();

            // clip to quantization levels
            trainTensor = trainTensor.clipByValue(0, vm._qLevel - 1);

            

            // now, shape (nTrials, nBands, nTSpaceDim, hdDim) by replacing levels with CiM components
            const trials = trainTensor.unstack();
            const trialsTransformed = []
            for (const trial of trials) {
                const trialTensor = tf.tidy(() => {
                    var trialTensor_ = vm._CiMEmbedding.apply(trial).toBool();
                    trialTensor_ = vm._encodeTSpacedim(trialTensor_);
                    trialTensor_ = vm._encodeBands(trialTensor_);
                    return trialTensor_
                });
                trialsTransformed.push(trialTensor);
            }
            const returnTensor = tf.stack(trialsTransformed);
            return returnTensor;
        });
        return batchTensor
    }

    /**
     * 
     * @param {Timetensor_d} timetensor 
     */
    async predict(timetensor) {
        const buffer_cpp = this._riemann.ArrayBuffer();
        this._riemannKernel.apply(timetensor, buffer_cpp);

        const tensor = this.encodeBatch(buffer_cpp, 1);

        const vm = this;
        const prediction = tf.tidy(() => {
            return vm._AM.logicalXor(tensor).logicalXor(tf.scalar(true, 'bool')).sum(1).div(tf.scalar(vm._hdDim));
        })
        tensor.dispose();

        const predictionArray = await prediction.array();
        prediction.dispose();
        return predictionArray
    }

    async fit() {
        const trainBuffer_ = this._riemann.ArrayBuffer();
        this._riemannKernel.fitTrials(trainBuffer_);
        const batchTensor = this.encodeBatch(trainBuffer_, this._nTrials);
        // then, construct AM with trials
        const labels = this._trialLabels.map((val, ind) => [val, ind]);
        const classSymbols = [];

        for (const classIdx of this._classLabels) 
        {
            
            const classLabels = labels.filter((val, ind, arr) => val[0] == classIdx).map((val, ind) => val[1]); 

            const classSymbol = tf.tidy(() => {
                const classLabelsTensor = tf.tensor1d(classLabels, 'int32');
                const classTrials = batchTensor.gather(classLabelsTensor);
                
                var classSymbol = classTrials.sum(0);
                const threshhold = Math.floor(classLabels.length / 2);

                classSymbol = classSymbol.clipByValue(threshhold, threshhold + 1).sub(tf.scalar(threshhold)).toBool();
                return classSymbol;
            });
        
            classSymbols.push(classSymbol);
        }

        this._AM = tf.stack(classSymbols);

        tf.dispose(classSymbols);

        const trainTensors = batchTensor.unstack();
        var i = 0;
        var nCorrects = 0;
        for (const trial of trainTensors) {
            const vm = this;
            const prediction = tf.tidy(() => {
                return vm._AM.logicalXor(trial).logicalXor(tf.scalar(true, 'bool')).sum(1).div(tf.scalar(vm._hdDim));
            })
            const predictionArray = await prediction.array();
            const pred = maxIdx(predictionArray);
            nCorrects += pred == this._trialLabels[i];
            i += 1;
        }
        const acc = nCorrects / trainTensors.length;
        console.log("acc: " + acc);
        
        batchTensor.dispose();
        tf.dispose(trainTensors);
    }


    _bernoulli() {
        var x = Math.random();
        if (x < 0.5) {
            return 0;
        } else {
            return 1;
        } 
    }

}