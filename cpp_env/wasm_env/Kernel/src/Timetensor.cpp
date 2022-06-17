#include "Timetensor.h"


template <>
Eigen::MatrixXd Timetensor<double>::computeCov(Eigen::Map<Eigen::MatrixXd> data)
{
    Eigen::MatrixXd dataXd = data;
    Eigen::MatrixXd cov;
    Riemann::covMtrx(dataXd, this->length, 0.1, cov);
    return cov;
}


template <>
void Timetensor<double>::init(std::vector<std::pair<std::string, std::vector<double>>> data, size_t length, bool storeAsCov)
{
    this->length = length;
    this->nChannels = data.begin()->second.size() / length;
    this->isCov = storeAsCov;

    for (const auto& bandData: data) 
    {
        auto id = bandData.first;
        auto vec = bandData.second;
        Eigen::Map<Eigen::MatrixXd> mat(vec.data(), nChannels, length); 
        if (storeAsCov) 
        {
            Eigen::MatrixXd covMat = this->computeCov(mat);
            std::pair<std::string, Eigen::MatrixXd> idMatPair(id, covMat);
            this->data.push_back(idMatPair);
        } else
        {
            std::pair<std::string, Eigen::Map<Eigen::MatrixXd>> idMatPair(id, mat);
            this->data.push_back(idMatPair);
        }
    }
}

template <>
Timetensor<double>::Timetensor() 
{
}


template <class T>
Timetensor<T>::Timetensor() 
{
}

template <class T>
void Timetensor<T>::init(std::vector<std::pair<std::string, std::vector<T>>> data, size_t length, bool storeAsCov)
{
}

template <class T>
Eigen::Matrix<T, Eigen::Dynamic, Eigen::Dynamic> Timetensor<T>::computeCov(Eigen::Map<Eigen::Matrix<T, Eigen::Dynamic, Eigen::Dynamic>> data)
{
}