#pragma once
#include <string>
#include <Eigen/Core>
#include <vector>
#include <Riemann/riemann.h>

template <class T>
class Timetensor {
private:

    Eigen::Matrix<T, Eigen::Dynamic, Eigen::Dynamic> computeCov(Eigen::Map<Eigen::Matrix<T, Eigen::Dynamic, Eigen::Dynamic>> data);

public:
    Timetensor();

    void init(std::vector<std::pair<std::string, std::vector<T>>> data, size_t length, bool storeAsCov);

    long length;

    long nChannels;

    bool isCov;


    std::vector<std::pair<std::string, Eigen::Matrix<T, Eigen::Dynamic, Eigen::Dynamic>>> data;
};