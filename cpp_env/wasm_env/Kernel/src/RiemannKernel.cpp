#include "RiemannKernel.h"
#include <iostream>
// ----------------- SPECIALIZATIONS ------------------
template <>
ArrayBuffer<double>& RiemannKernel<double>::vectorizeBatchOfCovs(std::vector<std::pair<std::string, std::vector<Eigen::MatrixXd>>> covs, ArrayBuffer<double>& result)
{   

    const size_t nTrials = covs.begin()->second.size(),
               nBands = covs.size(),
               nChannels = covs.begin()->second.begin()->rows();


    const size_t halfVectorizedSize = (nChannels * (nChannels + 1)) / 2;
    const size_t tensorSize = nTrials * nBands * halfVectorizedSize;
    double *tensorData = new double[tensorSize];

    for (int bandIdx = 0; bandIdx < nBands; bandIdx++)
    {
        const std::vector<Eigen::MatrixXd> bandData = covs[bandIdx].second;

        for (size_t trialIdx = 0; trialIdx < nTrials; trialIdx++) // through trials
        {
            // half vectorize via according mean
            Eigen::MatrixXd trialCov = bandData[trialIdx];
            Eigen::RowVectorXd result;
            Riemann::halfVectorization(trialCov, result, this->means[bandIdx].second);

            // copy result onto tensorbuffer
            double *vector = result.array().data();
            const size_t shift = (trialIdx * (nBands * halfVectorizedSize)) + (bandIdx * halfVectorizedSize);
            memcpy(tensorData + shift, (void *)vector, sizeof(double) * halfVectorizedSize);
        }
    }

    // return buffer as ArrayBuffer
    result.fill(tensorSize, tensorData);
    return result;
}

template <>
Eigen::MatrixXd RiemannKernel<double>::computeCov(Eigen::MatrixXd data, int nTimesteps) 
{
    Eigen::MatrixXd cov;
    Riemann::covMtrx(data, nTimesteps, 0.1, cov);
    return cov;
}


template <>
ArrayBuffer<double>& RiemannKernel<double>::fit(bool emit, std::vector<Timetensor<double>> trialsForFit, ArrayBuffer<double>& result)
{   

    const long nTrials = trialsForFit.size();
    if (nTrials < 1)
    {
        std::runtime_error("no trials to fit");
    }

    const long nBands = trialsForFit.begin()->data.size(),
               nChannels = trialsForFit.begin()->nChannels;

    // clear means
    if (this->means.size() != 0)
    {
        this->means.clear();
    }

    std::vector<std::pair<std::string, std::vector<Eigen::MatrixXd>>> covs; // of shape (n_bands, trials, cov)

    // init covs and means
    for (int bandIdx = 0; bandIdx < nBands; bandIdx++)
    {
        auto id = trialsForFit.begin()->data[bandIdx].first;
        std::pair<std::string, std::vector<Eigen::MatrixXd>> bandCovs;
        bandCovs.first = id;
        covs.push_back(bandCovs);

        std::pair<std::string, Eigen::MatrixXd> mean;
        mean.first = id;
        this->means.push_back(mean);
    }

    // compute cov matrices

    for (const auto &trial : trialsForFit)
    {
        if (trial.isCov)
        {
            for (int bandIdx = 0; bandIdx < nBands; bandIdx++)
            {
                covs[bandIdx].second.push_back(trial.data[bandIdx].second);
            }
        }
        else 
        {
            for (int bandIdx = 0; bandIdx < nBands; bandIdx++)
            {
                const Eigen::MatrixXd bandData = trial.data[bandIdx].second;
                Eigen::MatrixXd cov = this->computeCov(bandData, trial.length);
                covs[bandIdx].second.push_back(cov);
            }
        }
        
    }


    // compute means
    for (int bandIdx = 0; bandIdx < nBands; bandIdx++)
    {
        const std::vector<Eigen::MatrixXd> trialCovs = covs[bandIdx].second;
        if (!Riemann::meanRiemann(trialCovs, this->means[bandIdx].second, this->meanMetric))
        {
            std::runtime_error("failed to compute the Riemannian means");
        }
    }

    // compute vectorizations of training trials
    if (emit)
    {
        auto &buf = this->vectorizeBatchOfCovs(covs, result);
        return buf;
    }
    else
    {
        // if no emit, just return empty buffer
        return result;
    }
}

template <>
ArrayBuffer<double>& RiemannKernel<double>::apply(Timetensor<double>& trial, ArrayBuffer<double>& result)
{
    std::vector<std::pair<std::string, std::vector<Eigen::MatrixXd>>> covs;
    covs.resize(trial.data.size());

    for (int bandIdx = 0; bandIdx < trial.data.size(); bandIdx++)
    {
        if (trial.isCov)
        {
            covs[bandIdx].second.push_back(trial.data[bandIdx].second);
        }
        else 
        {
            const auto& band = trial.data[bandIdx];
            const auto& cov = this->computeCov(band.second, trial.length);
            covs[bandIdx].second.push_back(cov);
        }
        covs[bandIdx].first = trial.data[bandIdx].first;
    } 

    return this->vectorizeBatchOfCovs(covs, result);
}

template <>
RiemannKernel<double>::RiemannKernel()
{
    this->meanMetric = Geometry::EMetric::Riemann;
}

template <>
void RiemannKernel<double>::addTrial(Timetensor<double>& trial)
{
    this->trials.push_back(trial);
}

template <>
void RiemannKernel<double>::addBreak(Timetensor<double>& break_)
{
    this->breaks.push_back(break_);
}

template <>
ArrayBuffer<double>& RiemannKernel<double>::fitTrials(ArrayBuffer<double>& result)
{
    this->fit(true, this->trials, result);
    this->trials.clear();
    this->trials.shrink_to_fit();
    this->trials.reserve(this->expectedNTrials);
    return result;
}

template <>
void RiemannKernel<double>::fitBreaks()
{
    ArrayBuffer<double> buf;
    this->fit(false, this->breaks, buf);
}

template <>
void RiemannKernel<double>::reset()
{
    this->trials.clear();
    this->trials.reserve(this->expectedNTrials);

    this->breaks.clear();
    this->means.clear();
}

template <>
const char* RiemannKernel<double>::setMeanMetric(Geometry::EMetric metric)
{
    this->meanMetric = metric;
    return Geometry::toString(metric).c_str();
}

template <>
const char* RiemannKernel<double>::getCommaSeparatedMeanMetrics()
{
    const Geometry::EMetric metrics[] = {Geometry::EMetric::ALE, 
                    Geometry::EMetric::Euclidian, Geometry::EMetric::Harmonic, 
                    Geometry::EMetric::Identity, Geometry::EMetric::Kullback,
                    Geometry::EMetric::LogEuclidian, Geometry::EMetric::LogDet,
                    Geometry::EMetric::Riemann, Geometry::EMetric::Wasserstein};
    
    std::string metricIDs = "";
    for(const auto& metric : metrics) {
        if (metricIDs.length() > 0) { metricIDs += ","; } 
        metricIDs += Geometry::toString(metric);
    }
    return metricIDs.c_str();
}


template <>
Geometry::EMetric RiemannKernel<double>::getMeanMetric()
{   
    return this->meanMetric;
}

// --------------------- GENERICS -------------------------

template <class T>
const char* RiemannKernel<T>::setMeanMetric(Geometry::EMetric metric)
{
}

template <class T>
Geometry::EMetric RiemannKernel<T>::getMeanMetric()
{
}

template <class T>
const char* RiemannKernel<T>::getCommaSeparatedMeanMetrics()
{
}

template <class T>
void RiemannKernel<T>::reset()
{
}

template <class T>
void RiemannKernel<T>::fitBreaks()
{
}

template <class T>
ArrayBuffer<T>& RiemannKernel<T>::fitTrials(ArrayBuffer<T>& result)
{
}

template <class T>
ArrayBuffer<T>& RiemannKernel<T>::apply(Timetensor<T>& trial, ArrayBuffer<T>& result)
{
}

template <class T>
RiemannKernel<T>::RiemannKernel()
{
}

template <class T>
void RiemannKernel<T>::addTrial(Timetensor<T>& trial)
{
}

template <class T>
void RiemannKernel<T>::addBreak(Timetensor<T>& break_)
{
}

template <class T>
ArrayBuffer<T>& RiemannKernel<T>::vectorizeBatchOfCovs(std::vector<std::pair<std::string, std::vector<Eigen::Matrix<T, Eigen::Dynamic, Eigen::Dynamic>>>> trials, ArrayBuffer<T>& result)
{
}

template <class T>
Eigen::Matrix<T, Eigen::Dynamic, Eigen::Dynamic> RiemannKernel<T>::computeCov(Eigen::Matrix<T, Eigen::Dynamic, Eigen::Dynamic> data, int nTimesteps) 
{
}
