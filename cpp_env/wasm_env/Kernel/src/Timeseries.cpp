#include "Timeseries.h"
#include <stdexcept>

template <>
Timeseries<double>::Timeseries(const long nChannels, const long nBands, const long sampleRate, const long expectedTimesteps) 
{   
    this->nChannels = nChannels;
    this->nBands = nBands;
    this->expectedNTimesteps = expectedTimesteps;
    this->sampleRate = sampleRate;

    this->data.resize(this->nBands);

    this->initFilters();

    for (int bandIdx; bandIdx < this->nBands; bandIdx++) 
    {
        this->data[bandIdx].first = this->filters[bandIdx].first;
        this->data[bandIdx].second.reserve(this->expectedNTimesteps * this->nChannels);
    }

}

template <>
void Timeseries<double>::clear() {
    // reset filters
    for (auto& channel: this->filters) {
        for (auto& filter: channel.second) {
            filter.reset();
        }
    }

    // clear matrices
    const size_t sizeMat = this->expectedNTimesteps * this->nChannels;
    for (auto& band: this->data) 
    {
        band.second.clear();
        band.second.shrink_to_fit();
        band.second.reserve(sizeMat);
    }
}

template <>
void Timeseries<double>::addTimestep(double* timestep) 
{
    for(int fband = 0; fband < this->nBands; fband++ ) {
        for (int channelIdx = 0; channelIdx < this->nChannels; channelIdx++ ) {
            double filteredTimestep = this->filters[fband].second[channelIdx].filter(timestep[channelIdx]);
            this->data[fband].second.push_back(filteredTimestep);
        }
    }
}

template <>
void Timeseries<double>::loadCachedTensor(double* data, long nTimesteps, bool isCov, Timetensor<double>& result)
{
    std::vector<std::string> bandIds;
    for (const auto& filter: this->filters) { bandIds.push_back(filter.first); }

    result.loadFromCached(data, nTimesteps, bandIds, nChannels, isCov);
}

template <>
void Timeseries<double>::popAll(Timetensor<double>& result) 
{
    result.init(this->data, this->getLength(), true);
    this->clear();
}

std::pair<std::string, std::vector<double>> makeBandDataPair(std::string id, std::vector<double> data) 
{
    return std::pair<std::string, std::vector<double>>(id, data);
}

template <>
void Timeseries<double>::popN(long n, Timetensor<double>& result) 
{
    std::vector<std::pair<std::string, std::vector<double>>> bands;
    bands.resize(this->nBands);
    for (int bandIdx = 0; bandIdx < this->nBands; bandIdx++) 
    {   
        auto& bandData = this->data[bandIdx].second;
        auto id = this->data[bandIdx].first;

        auto begin = bandData.end() - (n * this->nChannels);
        auto end = bandData.end();

        std::vector<double> slicedSeries(begin, end);

        bands[bandIdx] = makeBandDataPair(id, slicedSeries);

        for(auto it = begin; it != end; ++it)
        {
            bandData.erase(it);
        }
    }
    result.init(bands, n, true);
}

template <>
void Timeseries<double>::getNLastSteps(long n, Timetensor<double>& result) 
{
    std::vector<std::pair<std::string, std::vector<double>>> bands;
    bands.resize(this->nBands);
    for (int bandIdx = 0; bandIdx < this->nBands; bandIdx++) 
    {
        auto& bandData = this->data[bandIdx].second;
        auto id = this->data[bandIdx].first;

        auto begin = bandData.end() - (n * this->nChannels);
        auto end = bandData.end();
        std::vector<double> slicedSeries(begin, end);
        
        bands[bandIdx] = makeBandDataPair(id, slicedSeries);
    }
    result.init(bands, n, true);
}

template <class T>
long Timeseries<T>::getLength() {
    long length = (long) this->data.begin()->second.size() / this->nChannels;
    return length;
}



template <class T>
void Timeseries<T>::initFilters() 
{
    // --------- INIT FILTER ---------
    auto filterBank = this->genFilterbank();

    for (const auto &[id, center, bw] : filterBank)
    {
        Iir::Butterworth::BandPass<2> f;
        f.setup(this->sampleRate, center, bw);

        std::vector<Iir::Butterworth::BandPass<2>> filterVec;
        for (int channelIdx = 0; channelIdx < this->nChannels; channelIdx++) {
            Iir::Butterworth::BandPass<2> fcopy(f);
            filterVec.push_back(fcopy);
        }
        std::pair<std::string, std::vector<Iir::Butterworth::BandPass<2>>> bandFilterObj(id, filterVec);
        this->filters.push_back(bandFilterObj);
    }
}

std::string toID(double a, double b) 
{
    std::string id = std::to_string(a) + "," + std::to_string(b);
    return id;
}

template <class T>
std::vector<std::tuple<std::string, double, double>> Timeseries<T>::genFilterbank()
{
    // --------------- CONFIG ----------------
    std::vector<int> overlappingBws;
    std::vector<int> nonOverlappingBws;
    int overlapShift = 4;

    int maxFreq = 40;
    int minFreq = 4;

    switch (nBands)
    {
    case 13:
        maxFreq = 30;
        minFreq = 4;
        nonOverlappingBws = {2};
        break;
    case 43:
        overlappingBws = {8, 16, 32};
        nonOverlappingBws = {2, 4};
        break;
    default:
        std::invalid_argument("invalid number of bands");
    }

    // ---------------------------------------

    std::vector<std::tuple<std::string, double, double>> bandConfigs;

    // overlapping bands
    for (const auto &bw : overlappingBws)
    {
        double currentCentre = minFreq + bw / 2;
        while (currentCentre + bw / 2 <= maxFreq)
        {
            std::string id = toID(currentCentre, (double) bw);
            auto config = std::make_tuple(id, currentCentre, (double)bw);
            bandConfigs.push_back(config);
            currentCentre += overlapShift;
        }
    }

    // non overlapping bands
    for (const auto &bw : nonOverlappingBws)
    {
        double currentCentre = minFreq + bw / 2;
        while (currentCentre + bw / 2 <= maxFreq)
        {
            std::string id = toID(currentCentre, (double) bw);
            auto config = std::make_tuple(id, currentCentre, (double)bw);
            bandConfigs.push_back(config);
            currentCentre += bw;
        }
    }

    return bandConfigs;
}

template <class T>
void Timeseries<T>::loadCachedTensor(T* data, long nTimesteps, bool isCov, Timetensor<T>& result)
{
}


template <class T> 
void Timeseries<T>::popAll(Timetensor<T>& result) 
{
}

template <class T>
void Timeseries<T>::popN(long n, Timetensor<T>& result) 
{

}

template <class T>
void Timeseries<T>::getNLastSteps(long n, Timetensor<T>& result) 
{

}


template <class T>
void Timeseries<T>::addTimestep(T* timestep) 
{

}

template <class T>
Timeseries<T>::Timeseries(const long nChannel, const long nBands, const long sampleRate, const long expectedTimesteps) 
{

}
