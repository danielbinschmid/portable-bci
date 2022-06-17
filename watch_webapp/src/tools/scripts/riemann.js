import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

// NOTE: unfinished idea

/**
 * 
 * @param {tf.Tensor2D[]} data 
 * @returns {(tf.Tensor2D | tf.Tensor2D[])[]}
 */
export function meanRiemann(data) {

}


export function meanEuclidian() {

}

/**
 * 
 * @param {tf.Tensor2D} cov
 * @returns {tf.Tensor1D} 
 */
export function halfVectorization(cov) {

}

/**
 * 
 * @param {tf.Tensor2D} timeseries 
 * @param {tf.Tensor2D} meanCov
 * @param {tf.Scalar} alpha
 * @returns {tf.Tensor2D}
 */
export function regularizedCovarianceMatrix(timeseries, meanCov, alpha) {
    return timeseries
}
