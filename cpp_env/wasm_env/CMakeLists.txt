cmake_minimum_required (VERSION 3.13)

project ("PreprocessingKernel")

set(CMAKE_BUILD_PARALLEL_LEVEL ON)

set(EIGEN Eigen) 
set(GEOMETRY RiemannGeometry)
set(RIGBYCPP rigbycpp)
set(MAIN_PROJECT Kernel)
option(WEBIDL "export to js" ON)

add_subdirectory(Kernel)
add_subdirectory(third-party/Eigen-fork)
add_subdirectory(third-party/RIGBy-cpp)
add_subdirectory(third-party/iir1)
add_subdirectory(Geometry)