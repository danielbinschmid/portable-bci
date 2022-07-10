
// Bindings utilities

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function WrapperObject() {
}
WrapperObject.prototype = Object.create(WrapperObject.prototype);
WrapperObject.prototype.constructor = WrapperObject;
WrapperObject.prototype.__class__ = WrapperObject;
WrapperObject.__cache__ = {};
Module['WrapperObject'] = WrapperObject;

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant)
    @param {*=} __class__ */
function getCache(__class__) {
  return (__class__ || WrapperObject).__cache__;
}
Module['getCache'] = getCache;

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant)
    @param {*=} __class__ */
function wrapPointer(ptr, __class__) {
  var cache = getCache(__class__);
  var ret = cache[ptr];
  if (ret) return ret;
  ret = Object.create((__class__ || WrapperObject).prototype);
  ret.ptr = ptr;
  return cache[ptr] = ret;
}
Module['wrapPointer'] = wrapPointer;

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function castObject(obj, __class__) {
  return wrapPointer(obj.ptr, __class__);
}
Module['castObject'] = castObject;

Module['NULL'] = wrapPointer(0);

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function destroy(obj) {
  if (!obj['__destroy__']) throw 'Error: Cannot destroy object. (Did you create it yourself?)';
  obj['__destroy__']();
  // Remove from cache, so the object can be GC'd and refs added onto it released
  delete getCache(obj.__class__)[obj.ptr];
}
Module['destroy'] = destroy;

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function compare(obj1, obj2) {
  return obj1.ptr === obj2.ptr;
}
Module['compare'] = compare;

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function getPointer(obj) {
  return obj.ptr;
}
Module['getPointer'] = getPointer;

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function getClass(obj) {
  return obj.__class__;
}
Module['getClass'] = getClass;

// Converts big (string or array) values into a C-style storage, in temporary space

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
var ensureCache = {
  buffer: 0,  // the main buffer of temporary storage
  size: 0,   // the size of buffer
  pos: 0,    // the next free offset in buffer
  temps: [], // extra allocations
  needed: 0, // the total size we need next time

  prepare: function() {
    if (ensureCache.needed) {
      // clear the temps
      for (var i = 0; i < ensureCache.temps.length; i++) {
        Module['_free'](ensureCache.temps[i]);
      }
      ensureCache.temps.length = 0;
      // prepare to allocate a bigger buffer
      Module['_free'](ensureCache.buffer);
      ensureCache.buffer = 0;
      ensureCache.size += ensureCache.needed;
      // clean up
      ensureCache.needed = 0;
    }
    if (!ensureCache.buffer) { // happens first time, or when we need to grow
      ensureCache.size += 128; // heuristic, avoid many small grow events
      ensureCache.buffer = Module['_malloc'](ensureCache.size);
      assert(ensureCache.buffer);
    }
    ensureCache.pos = 0;
  },
  alloc: function(array, view) {
    assert(ensureCache.buffer);
    var bytes = view.BYTES_PER_ELEMENT;
    var len = array.length * bytes;
    len = (len + 7) & -8; // keep things aligned to 8 byte boundaries
    var ret;
    if (ensureCache.pos + len >= ensureCache.size) {
      // we failed to allocate in the buffer, ensureCache time around :(
      assert(len > 0); // null terminator, at least
      ensureCache.needed += len;
      ret = Module['_malloc'](len);
      ensureCache.temps.push(ret);
    } else {
      // we can allocate in the buffer
      ret = ensureCache.buffer + ensureCache.pos;
      ensureCache.pos += len;
    }
    return ret;
  },
  copy: function(array, view, offset) {
    offset >>>= 0;
    var bytes = view.BYTES_PER_ELEMENT;
    switch (bytes) {
      case 2: offset >>>= 1; break;
      case 4: offset >>>= 2; break;
      case 8: offset >>>= 3; break;
    }
    for (var i = 0; i < array.length; i++) {
      view[offset + i] = array[i];
    }
  },
};

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function ensureString(value) {
  if (typeof value === 'string') {
    var intArray = intArrayFromString(value);
    var offset = ensureCache.alloc(intArray, HEAP8);
    ensureCache.copy(intArray, HEAP8, offset);
    return offset;
  }
  return value;
}
/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function ensureInt8(value) {
  if (typeof value === 'object') {
    var offset = ensureCache.alloc(value, HEAP8);
    ensureCache.copy(value, HEAP8, offset);
    return offset;
  }
  return value;
}
/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function ensureInt16(value) {
  if (typeof value === 'object') {
    var offset = ensureCache.alloc(value, HEAP16);
    ensureCache.copy(value, HEAP16, offset);
    return offset;
  }
  return value;
}
/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function ensureInt32(value) {
  if (typeof value === 'object') {
    var offset = ensureCache.alloc(value, HEAP32);
    ensureCache.copy(value, HEAP32, offset);
    return offset;
  }
  return value;
}
/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function ensureFloat32(value) {
  if (typeof value === 'object') {
    var offset = ensureCache.alloc(value, HEAPF32);
    ensureCache.copy(value, HEAPF32, offset);
    return offset;
  }
  return value;
}
/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */
function ensureFloat64(value) {
  if (typeof value === 'object') {
    var offset = ensureCache.alloc(value, HEAPF64);
    ensureCache.copy(value, HEAPF64, offset);
    return offset;
  }
  return value;
}


// VoidPtr
/** @suppress {undefinedVars, duplicate} @this{Object} */function VoidPtr() { throw "cannot construct a VoidPtr, no constructor in IDL" }
VoidPtr.prototype = Object.create(WrapperObject.prototype);
VoidPtr.prototype.constructor = VoidPtr;
VoidPtr.prototype.__class__ = VoidPtr;
VoidPtr.__cache__ = {};
Module['VoidPtr'] = VoidPtr;

  VoidPtr.prototype['__destroy__'] = VoidPtr.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_VoidPtr___destroy___0(self);
};
// ArrayBuffer_d
/** @suppress {undefinedVars, duplicate} @this{Object} */function ArrayBuffer_d() {
  this.ptr = _emscripten_bind_ArrayBuffer_d_ArrayBuffer_d_0();
  getCache(ArrayBuffer_d)[this.ptr] = this;
};;
ArrayBuffer_d.prototype = Object.create(WrapperObject.prototype);
ArrayBuffer_d.prototype.constructor = ArrayBuffer_d;
ArrayBuffer_d.prototype.__class__ = ArrayBuffer_d;
ArrayBuffer_d.__cache__ = {};
Module['ArrayBuffer_d'] = ArrayBuffer_d;

  ArrayBuffer_d.prototype['get_data'] = ArrayBuffer_d.prototype.get_data = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  return wrapPointer(_emscripten_bind_ArrayBuffer_d_get_data_0(self), VoidPtr);
};
    ArrayBuffer_d.prototype['set_data'] = ArrayBuffer_d.prototype.set_data = /** @suppress {undefinedVars, duplicate} @this{Object} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ArrayBuffer_d_set_data_1(self, arg0);
};
    Object.defineProperty(ArrayBuffer_d.prototype, 'data', { get: ArrayBuffer_d.prototype.get_data, set: ArrayBuffer_d.prototype.set_data });
  ArrayBuffer_d.prototype['get_length'] = ArrayBuffer_d.prototype.get_length = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  return _emscripten_bind_ArrayBuffer_d_get_length_0(self);
};
    ArrayBuffer_d.prototype['set_length'] = ArrayBuffer_d.prototype.set_length = /** @suppress {undefinedVars, duplicate} @this{Object} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_ArrayBuffer_d_set_length_1(self, arg0);
};
    Object.defineProperty(ArrayBuffer_d.prototype, 'length', { get: ArrayBuffer_d.prototype.get_length, set: ArrayBuffer_d.prototype.set_length });
  ArrayBuffer_d.prototype['__destroy__'] = ArrayBuffer_d.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_ArrayBuffer_d___destroy___0(self);
};
// Timetensor_d
/** @suppress {undefinedVars, duplicate} @this{Object} */function Timetensor_d() {
  this.ptr = _emscripten_bind_Timetensor_d_Timetensor_d_0();
  getCache(Timetensor_d)[this.ptr] = this;
};;
Timetensor_d.prototype = Object.create(WrapperObject.prototype);
Timetensor_d.prototype.constructor = Timetensor_d;
Timetensor_d.prototype.__class__ = Timetensor_d;
Timetensor_d.__cache__ = {};
Module['Timetensor_d'] = Timetensor_d;

Timetensor_d.prototype['getData'] = Timetensor_d.prototype.getData = /** @suppress {undefinedVars, duplicate} @this{Object} */function(result) {
  var self = this.ptr;
  if (result && typeof result === 'object') result = result.ptr;
  _emscripten_bind_Timetensor_d_getData_1(self, result);
};;

  Timetensor_d.prototype['get_length'] = Timetensor_d.prototype.get_length = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  return _emscripten_bind_Timetensor_d_get_length_0(self);
};
    Timetensor_d.prototype['set_length'] = Timetensor_d.prototype.set_length = /** @suppress {undefinedVars, duplicate} @this{Object} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_Timetensor_d_set_length_1(self, arg0);
};
    Object.defineProperty(Timetensor_d.prototype, 'length', { get: Timetensor_d.prototype.get_length, set: Timetensor_d.prototype.set_length });
  Timetensor_d.prototype['get_nBands'] = Timetensor_d.prototype.get_nBands = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  return _emscripten_bind_Timetensor_d_get_nBands_0(self);
};
    Timetensor_d.prototype['set_nBands'] = Timetensor_d.prototype.set_nBands = /** @suppress {undefinedVars, duplicate} @this{Object} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_Timetensor_d_set_nBands_1(self, arg0);
};
    Object.defineProperty(Timetensor_d.prototype, 'nBands', { get: Timetensor_d.prototype.get_nBands, set: Timetensor_d.prototype.set_nBands });
  Timetensor_d.prototype['get_nChannels'] = Timetensor_d.prototype.get_nChannels = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  return _emscripten_bind_Timetensor_d_get_nChannels_0(self);
};
    Timetensor_d.prototype['set_nChannels'] = Timetensor_d.prototype.set_nChannels = /** @suppress {undefinedVars, duplicate} @this{Object} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_Timetensor_d_set_nChannels_1(self, arg0);
};
    Object.defineProperty(Timetensor_d.prototype, 'nChannels', { get: Timetensor_d.prototype.get_nChannels, set: Timetensor_d.prototype.set_nChannels });
  Timetensor_d.prototype['get_isCov'] = Timetensor_d.prototype.get_isCov = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  return !!(_emscripten_bind_Timetensor_d_get_isCov_0(self));
};
    Timetensor_d.prototype['set_isCov'] = Timetensor_d.prototype.set_isCov = /** @suppress {undefinedVars, duplicate} @this{Object} */function(arg0) {
  var self = this.ptr;
  if (arg0 && typeof arg0 === 'object') arg0 = arg0.ptr;
  _emscripten_bind_Timetensor_d_set_isCov_1(self, arg0);
};
    Object.defineProperty(Timetensor_d.prototype, 'isCov', { get: Timetensor_d.prototype.get_isCov, set: Timetensor_d.prototype.set_isCov });
  Timetensor_d.prototype['__destroy__'] = Timetensor_d.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_Timetensor_d___destroy___0(self);
};
// Timeseries_d
/** @suppress {undefinedVars, duplicate} @this{Object} */function Timeseries_d(nChannels, nBands, sampleRate, expectedTimesteps) {
  if (nChannels && typeof nChannels === 'object') nChannels = nChannels.ptr;
  if (nBands && typeof nBands === 'object') nBands = nBands.ptr;
  if (sampleRate && typeof sampleRate === 'object') sampleRate = sampleRate.ptr;
  if (expectedTimesteps && typeof expectedTimesteps === 'object') expectedTimesteps = expectedTimesteps.ptr;
  this.ptr = _emscripten_bind_Timeseries_d_Timeseries_d_4(nChannels, nBands, sampleRate, expectedTimesteps);
  getCache(Timeseries_d)[this.ptr] = this;
};;
Timeseries_d.prototype = Object.create(WrapperObject.prototype);
Timeseries_d.prototype.constructor = Timeseries_d;
Timeseries_d.prototype.__class__ = Timeseries_d;
Timeseries_d.__cache__ = {};
Module['Timeseries_d'] = Timeseries_d;

Timeseries_d.prototype['addTimestep'] = Timeseries_d.prototype.addTimestep = /** @suppress {undefinedVars, duplicate} @this{Object} */function(timestep) {
  var self = this.ptr;
  ensureCache.prepare();
  if (typeof timestep == 'object') { timestep = ensureFloat64(timestep); }
  _emscripten_bind_Timeseries_d_addTimestep_1(self, timestep);
};;

Timeseries_d.prototype['getLength'] = Timeseries_d.prototype.getLength = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  return _emscripten_bind_Timeseries_d_getLength_0(self);
};;

Timeseries_d.prototype['clear'] = Timeseries_d.prototype.clear = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_Timeseries_d_clear_0(self);
};;

Timeseries_d.prototype['loadCachedTensor'] = Timeseries_d.prototype.loadCachedTensor = /** @suppress {undefinedVars, duplicate} @this{Object} */function(data, nTimesteps, isCov, result) {
  var self = this.ptr;
  ensureCache.prepare();
  if (typeof data == 'object') { data = ensureFloat64(data); }
  if (nTimesteps && typeof nTimesteps === 'object') nTimesteps = nTimesteps.ptr;
  if (isCov && typeof isCov === 'object') isCov = isCov.ptr;
  if (result && typeof result === 'object') result = result.ptr;
  _emscripten_bind_Timeseries_d_loadCachedTensor_4(self, data, nTimesteps, isCov, result);
};;

Timeseries_d.prototype['popAll'] = Timeseries_d.prototype.popAll = /** @suppress {undefinedVars, duplicate} @this{Object} */function(result) {
  var self = this.ptr;
  if (result && typeof result === 'object') result = result.ptr;
  _emscripten_bind_Timeseries_d_popAll_1(self, result);
};;

Timeseries_d.prototype['popN'] = Timeseries_d.prototype.popN = /** @suppress {undefinedVars, duplicate} @this{Object} */function(n, result) {
  var self = this.ptr;
  if (n && typeof n === 'object') n = n.ptr;
  if (result && typeof result === 'object') result = result.ptr;
  _emscripten_bind_Timeseries_d_popN_2(self, n, result);
};;

Timeseries_d.prototype['getNLastSteps'] = Timeseries_d.prototype.getNLastSteps = /** @suppress {undefinedVars, duplicate} @this{Object} */function(n, result) {
  var self = this.ptr;
  if (n && typeof n === 'object') n = n.ptr;
  if (result && typeof result === 'object') result = result.ptr;
  _emscripten_bind_Timeseries_d_getNLastSteps_2(self, n, result);
};;

  Timeseries_d.prototype['__destroy__'] = Timeseries_d.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_Timeseries_d___destroy___0(self);
};
// RiemannKernel_d
/** @suppress {undefinedVars, duplicate} @this{Object} */function RiemannKernel_d() {
  this.ptr = _emscripten_bind_RiemannKernel_d_RiemannKernel_d_0();
  getCache(RiemannKernel_d)[this.ptr] = this;
};;
RiemannKernel_d.prototype = Object.create(WrapperObject.prototype);
RiemannKernel_d.prototype.constructor = RiemannKernel_d;
RiemannKernel_d.prototype.__class__ = RiemannKernel_d;
RiemannKernel_d.__cache__ = {};
Module['RiemannKernel_d'] = RiemannKernel_d;

RiemannKernel_d.prototype['addTrial'] = RiemannKernel_d.prototype.addTrial = /** @suppress {undefinedVars, duplicate} @this{Object} */function(trial) {
  var self = this.ptr;
  if (trial && typeof trial === 'object') trial = trial.ptr;
  _emscripten_bind_RiemannKernel_d_addTrial_1(self, trial);
};;

RiemannKernel_d.prototype['addBreak'] = RiemannKernel_d.prototype.addBreak = /** @suppress {undefinedVars, duplicate} @this{Object} */function(break_) {
  var self = this.ptr;
  if (break_ && typeof break_ === 'object') break_ = break_.ptr;
  _emscripten_bind_RiemannKernel_d_addBreak_1(self, break_);
};;

RiemannKernel_d.prototype['updateMean'] = RiemannKernel_d.prototype.updateMean = /** @suppress {undefinedVars, duplicate} @this{Object} */function(timetensor, weight) {
  var self = this.ptr;
  if (timetensor && typeof timetensor === 'object') timetensor = timetensor.ptr;
  if (weight && typeof weight === 'object') weight = weight.ptr;
  _emscripten_bind_RiemannKernel_d_updateMean_2(self, timetensor, weight);
};;

RiemannKernel_d.prototype['fitTrials'] = RiemannKernel_d.prototype.fitTrials = /** @suppress {undefinedVars, duplicate} @this{Object} */function(result) {
  var self = this.ptr;
  if (result && typeof result === 'object') result = result.ptr;
  _emscripten_bind_RiemannKernel_d_fitTrials_1(self, result);
};;

RiemannKernel_d.prototype['getMeanMetric'] = RiemannKernel_d.prototype.getMeanMetric = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  return _emscripten_bind_RiemannKernel_d_getMeanMetric_0(self);
};;

RiemannKernel_d.prototype['getCommaSeparatedMeanMetrics'] = RiemannKernel_d.prototype.getCommaSeparatedMeanMetrics = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  return UTF8ToString(_emscripten_bind_RiemannKernel_d_getCommaSeparatedMeanMetrics_0(self));
};;

RiemannKernel_d.prototype['setMeanMetric'] = RiemannKernel_d.prototype.setMeanMetric = /** @suppress {undefinedVars, duplicate} @this{Object} */function(metric) {
  var self = this.ptr;
  if (metric && typeof metric === 'object') metric = metric.ptr;
  return UTF8ToString(_emscripten_bind_RiemannKernel_d_setMeanMetric_1(self, metric));
};;

RiemannKernel_d.prototype['fitBreaks'] = RiemannKernel_d.prototype.fitBreaks = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_RiemannKernel_d_fitBreaks_0(self);
};;

RiemannKernel_d.prototype['reset'] = RiemannKernel_d.prototype.reset = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_RiemannKernel_d_reset_0(self);
};;

RiemannKernel_d.prototype['apply'] = RiemannKernel_d.prototype.apply = /** @suppress {undefinedVars, duplicate} @this{Object} */function(trial, result) {
  var self = this.ptr;
  if (trial && typeof trial === 'object') trial = trial.ptr;
  if (result && typeof result === 'object') result = result.ptr;
  _emscripten_bind_RiemannKernel_d_apply_2(self, trial, result);
};;

  RiemannKernel_d.prototype['__destroy__'] = RiemannKernel_d.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */function() {
  var self = this.ptr;
  _emscripten_bind_RiemannKernel_d___destroy___0(self);
};
(function() {
  function setupEnums() {
    

    // EMetric

    Module['ALE'] = _emscripten_enum_EMetric_ALE();

    Module['Riemann'] = _emscripten_enum_EMetric_Riemann();

    Module['Euclidian'] = _emscripten_enum_EMetric_Euclidian();

    Module['LogEuclidian'] = _emscripten_enum_EMetric_LogEuclidian();

    Module['LogDet'] = _emscripten_enum_EMetric_LogDet();

    Module['Kullback'] = _emscripten_enum_EMetric_Kullback();

    Module['Harmonic'] = _emscripten_enum_EMetric_Harmonic();

    Module['Wasserstein'] = _emscripten_enum_EMetric_Wasserstein();

    Module['Identity'] = _emscripten_enum_EMetric_Identity();

  }
  if (runtimeInitialized) setupEnums();
  else addOnInit(setupEnums);
})();
