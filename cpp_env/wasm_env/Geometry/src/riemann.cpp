#include "Riemann/riemann.h"
#include <Geometry/Mean.hpp>
#include <Geometry/Featurization.hpp>

#include <iostream>

using namespace Eigen;


template <>
bool Riemann::covMtrx(Matrix<double, Dynamic, Dynamic> X, int ns, double alpha, Matrix<double, Dynamic, Dynamic> &result)
{
    VectorXd v = VectorXd::Constant(X.rows(), alpha / ns);
    Matrix<double, Dynamic, Dynamic> l = X * X.transpose();
    l *= 1.0 / (ns - 1.0);
    l += v.asDiagonal();
    MatrixXd m = v.asDiagonal();
    result = l;
    return true;
}

template <>
bool Riemann::meanRiemann(const std::vector<Matrix<double, Dynamic, Dynamic>> &covs, Matrix<double, Dynamic, Dynamic> &mean, Geometry::EMetric metric)
{   
    return Geometry::Mean(covs, mean, metric);
}

template <>
bool Riemann::halfVectorization(
    Matrix<double, Dynamic, Dynamic> &cov,
    RowVectorXd &vectorizedResult,
    Matrix<double, Dynamic, Dynamic> &mean)
{
    return Geometry::TangentSpace(cov, vectorizedResult, mean);
}

template <class T>
bool Riemann::halfVectorization(
    Matrix<T, Dynamic, Dynamic> &cov,
    RowVectorXd &vectorizedResult,
    Matrix<T, Dynamic, Dynamic> &mean)
{
    return false;
}

template <class T>
bool Riemann::meanRiemann(const std::vector<Matrix<T, Dynamic, Dynamic>> &covs, Matrix<T, Dynamic, Dynamic> &mean, Geometry::EMetric metric)
{
    return false;
}

template <class T>
bool Riemann::covMtrx(Matrix<T, Dynamic, Dynamic> X, int ns, T alpha, Matrix<T, Dynamic, Dynamic> &result)
{
    return false;
}
