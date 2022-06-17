/**
 * @interface
 */
 var ArrayBuffer_d = {};
 ArrayBuffer_d.length = 0;
 ArrayBuffer_d.data = null;
 
 
 var BufferMatrix_d = {};
 
 var FrequencyBands_d = {};
 
 /**
  * 
  * @param {number} arg0 
  * @param {BufferMatrix_d} arg1 
  */
 FrequencyBands_d.addBand = (arg0, arg1) => { }
 
 var TrialCollection_d = {}
 /**
  * 
  * @param {FreqencyBands} arg0 
  */
 TrialCollection_d.addTrial = (arg0) => { }
 
 
 var RiemannianKernel_d = {}
 
 /**
  * 
  * @param {TrialCollection_d} arg0 
  * @param {boolean} arg1 
  * @returns {ArrayBuffer_d}
  */
 RiemannianKernel_d.fit = (arg0, arg1) => { }
 
 /**
  * 
  * @param {FrequencyBands_d} arg0 
  * @returns {ArrayBuffer_d}
  */
 RiemannianKernel_d.apply = (arg0) => { }