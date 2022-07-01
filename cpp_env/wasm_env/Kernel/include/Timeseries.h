#include <vector>
#include <tuple>
#include <Iir.h>
#include "Timetensor.h"


template <class T>
class Timeseries {
private:
    std::vector<std::tuple<std::string, double, double>> genFilterbank();

    
    /**
     * (nBands, nChannels * nSteps). data is indexed by [bandIdx][t * nChannels + channelIdx]
     * 
     * pair string contain band ids.
     */
    std::vector<std::pair<std::string, std::vector<T>>> data; 


    long nChannels;
    long nBands;
    long sampleRate;
    long expectedNTimesteps;


    void initFilters();

    /**
     * (nBands, nChannels)
     * 
     * pair string contain band ids
     */
    std::vector<std::pair<std::string, std::vector<Iir::Butterworth::BandPass<2>>>> filters;

public:
	Timeseries(const long nChannels, const long nBands, const long sampleRate, const long expectedTimesteps);

    /**
     * Adds a timestep and immediately applies the bandpass filters.
     */ 
    void addTimestep(T* timestep);

    /**
     * Returns the current number of stored timesteps.
     */
    long getLength();

    /**
     * Clears storage and resets filter.
     */ 
    void clear();

    void loadCachedTensor(T* data, long nTimesteps, bool isCov, Timetensor<T>& result);
    
    /**
     * Returns a timetensor containing all timesteps and clears the Timeseries.
     */
    void popAll(Timetensor<T>& result);

    /**
     * Returns the last n timesteps as Timetensor and removes only them from the internal storage.
     */
    void popN(long n, Timetensor<T>& result);

    /**
     * Returns last n timesteps.
     */
    void getNLastSteps(long n, Timetensor<T>& result);
};