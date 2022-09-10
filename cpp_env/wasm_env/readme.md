# C++ and Webassembly workspace
This subfolder contains the code for the Webassembly backend of the Smartwatch application and the javascript based experiments.
Cmake is used for compilation.

The workspace is structured in three folders.
- `Geometry` contains function calls for Riemannian Geometry with covariance matrices. Uses the [RigByCpp](https://github.com/tmonseigne/RIGBy-cpp) library. 
- `Kernel` contains the main entry point that is compiled to Webassembly. The `src/webidl/webidl.idl` file contains the API for the javascript side.
- `third-party` contains the forks of the used third-party libraries, i.e. [Eigen](https://eigen.tuxfamily.org), [iir1](https://github.com/berndporr/iir1), and [RigByCpp](https://github.com/tmonseigne/RIGBy-cpp). Run `git submodule init` in the terminal to fetch the code of the third-party libraries.

## Compilation
Compilation is done by Cmake. In every subfolder sits a `CmakeLists.txt` file which contains the compilation logic. The `CmakeLists.txt` in the folder of this readme is the entry point. 

To build the code by yourself, first create a build directory by
```s
mkdir build 
```
from the root directory (the directory of this readme file). `cd` into the build directory, then run 
```s
cmake ..
cmake --build .
```

```s
git clone https://github.com/berndporr/iir1
cmake .
make
sudo make install
```



