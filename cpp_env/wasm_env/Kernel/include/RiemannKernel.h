#include <Eigen/Core>
#include <vector>

#include <unsupported/Eigen/MatrixFunctions>
#include <Riemann/riemann.h>
#include "Timetensor.h"
#include <cassert>
#include <Geometry/Metrics.hpp>

/*
* T is the precision, i.e. float or double
*/
template <class T>
class RiemannKernel {

private:
    std::vector<Timetensor<T>> trials;
    std::vector<Timetensor<T>> breaks;
    
    const int expectedNTrials = 100;

    unsigned long nTrials;

    ArrayBuffer<T>& vectorizeBatchOfCovs(std::vector<std::pair<std::string, std::vector < Eigen::Matrix<T, Eigen::Dynamic, Eigen::Dynamic> >>> trials, ArrayBuffer<T>& result);

    Eigen::Matrix<T, Eigen::Dynamic, Eigen::Dynamic> computeCov(Eigen::Matrix<T, Eigen::Dynamic, Eigen::Dynamic> data, int nTimesteps);

    ArrayBuffer<T>& fit(bool emit, std::vector<Timetensor<T>> trialsForFit, ArrayBuffer<T>& result);

public:
	RiemannKernel();

	std::vector<std::pair<std::string, Eigen::Matrix<T, Eigen::Dynamic, Eigen::Dynamic>>> means;
    void addTrial(Timetensor<T>& trial);

    void addBreak(Timetensor<T>& break_);

	void fitTrials(ArrayBuffer<T>& result);

    void fitBreaks();

    void reset();

    void updateMean(Timetensor<T>& timetensor, double weight);

    const char* setMeanMetric(Geometry::EMetric metric);

    Geometry::EMetric getMeanMetric();

    const char* getCommaSeparatedMeanMetrics();
    
    Geometry::EMetric meanMetric;

	void apply(Timetensor<T>& trial, ArrayBuffer<T>& result);





};





