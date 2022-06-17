#include <unsupported/Eigen/MatrixFunctions>
#include <Eigen/core>
#include <vector>
#include <Geometry/Metrics.hpp>
// using namespace Eigen



namespace Riemann {


	template <class T>
	bool covMtrx(Eigen::Matrix<T, Eigen::Dynamic, Eigen::Dynamic> X, int ns, T alpha, Eigen::Matrix<T, Eigen::Dynamic, Eigen::Dynamic>& result);

	template<class T>
	bool halfVectorization(
		Eigen::Matrix<T, Eigen::Dynamic, Eigen::Dynamic>& cov,
		Eigen::RowVectorXd& vectorizedResult,
		Eigen::Matrix<T, Eigen::Dynamic, Eigen::Dynamic>& mean);


	template<class T>
	bool meanRiemann(const std::vector<Eigen::Matrix<T, Eigen::Dynamic, Eigen::Dynamic>>& covs, 
                Eigen::Matrix<T, Eigen::Dynamic, Eigen::Dynamic>& mean,
                Geometry::EMetric metric);

}