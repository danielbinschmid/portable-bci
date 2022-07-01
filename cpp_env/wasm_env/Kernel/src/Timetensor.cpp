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
    this->nBands = data.size();

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
void Timetensor<double>::getData(ArrayBuffer<double>& result) 
{
    const size_t matSize = this->data.begin()->second.array().size();
    double* resBuf = new double[matSize * this->nBands];

    for (int bandIdx = 0; bandIdx < this->nBands; bandIdx++) {
        const auto& bandData = this->data[bandIdx];
        const double* bandArray = bandData.second.array().data();
        memmove(resBuf + bandIdx * matSize, bandArray, matSize * sizeof(double));
    }

    result.fill(matSize * this->nBands, resBuf);
}

template <>
void Timetensor<double>::loadFromCached(double* data, long nTimesteps, std::vector<std::string> bandIds, long nChannels ,bool isCov)
{
    this->data.clear();
    this->length = nTimesteps;
    this->nBands = bandIds.size();
    this->isCov = isCov;
    this->nChannels = nChannels;

    size_t matSize, nRows, nCols;
    if (isCov) 
    { 
        matSize = nChannels * nChannels; 
        nRows = nChannels;
        nCols = nChannels;
    }
    else      
    { 
        matSize = nTimesteps * nChannels; 
        nRows = nChannels;
        nCols = nTimesteps;
    }

    for (int bandIdx = 0; bandIdx < this->nBands; bandIdx++)
    {
        auto id = bandIds[bandIdx];
        double* dataMat = new double[matSize];
        memmove(dataMat, data + bandIdx * matSize, matSize * sizeof(double));

        Eigen::Map<Eigen::MatrixXd> mat(dataMat, nRows, nCols);
        std::pair<std::string, Eigen::Map<Eigen::MatrixXd>> idMatPair(id, mat);
        this->data.push_back(idMatPair);
    }
}

template <>
Timetensor<double>::Timetensor() 
{
}

template<class T>
void Timetensor<T>::getData(ArrayBuffer<T>& result) 
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