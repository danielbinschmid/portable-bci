import { meanRiemann, halfVectorization, regularizedCovarianceMatrix } from "@/tools/scripts/riemann";
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
/**
 * NOTE: unfinished idea. Riemannian Kernel is currently implemented in the cpp module.
 */
export class RiemannianKernel {
    _alpha;
    _means;
    constructor() {
        this._means = []
        this._alpha = tf.scalar(0.1, dtype = 'float32')
    }

    /**
     * Computes the Riemannian mean and saves the mean. Returns the covariance matrices of the training data.
     * @param {tf.Tensor2D[][]} data - for each frequency band every trial and its (n_channels, n_windows)
     * @return {tf.Tensor2D[][]}
     */
    fit(data) {
        const train_feats = []
        for (const band_data of data) {
            const [mean, covs] = meanRiemann(band_data);
            this._means.push(mean)
            train_feats.push(covs)
        }
        return train_feats
    }

    /**
     * Computes the covariance matrix, and log-whitens it with the mean
     * 
     * @param {tf.Tensor2D[]} a - list of Tensors of shape (n_channels, n_windows). For each frequency band
     * @returns {tf.Tensor1D[]}
     */
    apply(a) {
        const res = []
        for (var i = 0; i < a.length; i++) {
            const t = a[i];
            tf.slice4d()
            const cov = regularizedCovarianceMatrix(t, this._means[i], this._alpha)
            const v = halfVectorization(cov)
            res.push(v)
        }
        return res
    }

    
}