#include "template_typedefs.h"
using Geometry::EMetric;
#include <emscripten.h>

extern "C" {

// Not using size_t for array indices as the values used by the javascript code are signed.

EM_JS(void, array_bounds_check_error, (size_t idx, size_t size), {
  throw 'Array index ' + idx + ' out of bounds: [0,' + size + ')';
});

void array_bounds_check(const int array_size, const int array_idx) {
  if (array_idx < 0 || array_idx >= array_size) {
    array_bounds_check_error(array_idx, array_size);
  }
}

// VoidPtr

void EMSCRIPTEN_KEEPALIVE emscripten_bind_VoidPtr___destroy___0(void** self) {
  delete self;
}

// Timetensor_d

Timetensor_d* EMSCRIPTEN_KEEPALIVE emscripten_bind_Timetensor_d_Timetensor_d_0() {
  return new Timetensor_d();
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_Timetensor_d_get_length_0(Timetensor_d* self) {
  return self->length;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_Timetensor_d_set_length_1(Timetensor_d* self, int arg0) {
  self->length = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_Timetensor_d_get_nChannels_0(Timetensor_d* self) {
  return self->nChannels;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_Timetensor_d_set_nChannels_1(Timetensor_d* self, int arg0) {
  self->nChannels = arg0;
}

bool EMSCRIPTEN_KEEPALIVE emscripten_bind_Timetensor_d_get_isCov_0(Timetensor_d* self) {
  return self->isCov;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_Timetensor_d_set_isCov_1(Timetensor_d* self, bool arg0) {
  self->isCov = arg0;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_Timetensor_d___destroy___0(Timetensor_d* self) {
  delete self;
}

// Timeseries_d

Timeseries_d* EMSCRIPTEN_KEEPALIVE emscripten_bind_Timeseries_d_Timeseries_d_4(const int nChannels, const int nBands, const int sampleRate, const int expectedTimesteps) {
  return new Timeseries_d(nChannels, nBands, sampleRate, expectedTimesteps);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_Timeseries_d_addTimestep_1(Timeseries_d* self, double* timestep) {
  self->addTimestep(timestep);
}

const int EMSCRIPTEN_KEEPALIVE emscripten_bind_Timeseries_d_getLength_0(Timeseries_d* self) {
  return self->getLength();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_Timeseries_d_clear_0(Timeseries_d* self) {
  self->clear();
}

Timetensor_d* EMSCRIPTEN_KEEPALIVE emscripten_bind_Timeseries_d_popAll_1(Timeseries_d* self, Timetensor_d* result) {
  return &self->popAll(*result);
}

Timetensor_d* EMSCRIPTEN_KEEPALIVE emscripten_bind_Timeseries_d_popN_2(Timeseries_d* self, int n, Timetensor_d* result) {
  return &self->popN(n, *result);
}

Timetensor_d* EMSCRIPTEN_KEEPALIVE emscripten_bind_Timeseries_d_getNLastSteps_2(Timeseries_d* self, int n, Timetensor_d* result) {
  return &self->getNLastSteps(n, *result);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_Timeseries_d___destroy___0(Timeseries_d* self) {
  delete self;
}

// ArrayBuffer_d

ArrayBuffer_d* EMSCRIPTEN_KEEPALIVE emscripten_bind_ArrayBuffer_d_ArrayBuffer_d_0() {
  return new ArrayBuffer_d();
}

void* EMSCRIPTEN_KEEPALIVE emscripten_bind_ArrayBuffer_d_get_data_0(ArrayBuffer_d* self) {
  return self->data;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ArrayBuffer_d_set_data_1(ArrayBuffer_d* self, void* arg0) {
  self->data = arg0;
}

int EMSCRIPTEN_KEEPALIVE emscripten_bind_ArrayBuffer_d_get_length_0(ArrayBuffer_d* self) {
  return self->length;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ArrayBuffer_d_set_length_1(ArrayBuffer_d* self, int arg0) {
  self->length = arg0;
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_ArrayBuffer_d___destroy___0(ArrayBuffer_d* self) {
  delete self;
}

// RiemannKernel_d

RiemannKernel_d* EMSCRIPTEN_KEEPALIVE emscripten_bind_RiemannKernel_d_RiemannKernel_d_0() {
  return new RiemannKernel_d();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RiemannKernel_d_addTrial_1(RiemannKernel_d* self, Timetensor_d* trial) {
  self->addTrial(*trial);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RiemannKernel_d_addBreak_1(RiemannKernel_d* self, Timetensor_d* break_) {
  self->addBreak(*break_);
}

ArrayBuffer_d* EMSCRIPTEN_KEEPALIVE emscripten_bind_RiemannKernel_d_fitTrials_1(RiemannKernel_d* self, ArrayBuffer_d* result) {
  return &self->fitTrials(*result);
}

EMetric EMSCRIPTEN_KEEPALIVE emscripten_bind_RiemannKernel_d_getMeanMetric_0(RiemannKernel_d* self) {
  return self->getMeanMetric();
}

const char* EMSCRIPTEN_KEEPALIVE emscripten_bind_RiemannKernel_d_getCommaSeparatedMeanMetrics_0(RiemannKernel_d* self) {
  return self->getCommaSeparatedMeanMetrics();
}

const char* EMSCRIPTEN_KEEPALIVE emscripten_bind_RiemannKernel_d_setMeanMetric_1(RiemannKernel_d* self, EMetric metric) {
  return self->setMeanMetric(metric);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RiemannKernel_d_fitBreaks_0(RiemannKernel_d* self) {
  self->fitBreaks();
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RiemannKernel_d_reset_0(RiemannKernel_d* self) {
  self->reset();
}

ArrayBuffer_d* EMSCRIPTEN_KEEPALIVE emscripten_bind_RiemannKernel_d_apply_2(RiemannKernel_d* self, Timetensor_d* trial, ArrayBuffer_d* result) {
  return &self->apply(*trial, *result);
}

void EMSCRIPTEN_KEEPALIVE emscripten_bind_RiemannKernel_d___destroy___0(RiemannKernel_d* self) {
  delete self;
}

// EMetric
EMetric EMSCRIPTEN_KEEPALIVE emscripten_enum_EMetric_ALE() {
  return EMetric::ALE;
}
EMetric EMSCRIPTEN_KEEPALIVE emscripten_enum_EMetric_Riemann() {
  return EMetric::Riemann;
}
EMetric EMSCRIPTEN_KEEPALIVE emscripten_enum_EMetric_Euclidian() {
  return EMetric::Euclidian;
}
EMetric EMSCRIPTEN_KEEPALIVE emscripten_enum_EMetric_LogEuclidian() {
  return EMetric::LogEuclidian;
}
EMetric EMSCRIPTEN_KEEPALIVE emscripten_enum_EMetric_LogDet() {
  return EMetric::LogDet;
}
EMetric EMSCRIPTEN_KEEPALIVE emscripten_enum_EMetric_Kullback() {
  return EMetric::Kullback;
}
EMetric EMSCRIPTEN_KEEPALIVE emscripten_enum_EMetric_Harmonic() {
  return EMetric::Harmonic;
}
EMetric EMSCRIPTEN_KEEPALIVE emscripten_enum_EMetric_Wasserstein() {
  return EMetric::Wasserstein;
}
EMetric EMSCRIPTEN_KEEPALIVE emscripten_enum_EMetric_Identity() {
  return EMetric::Identity;
}

}

