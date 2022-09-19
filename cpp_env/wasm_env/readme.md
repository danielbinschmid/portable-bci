# C++ and Webassembly workspace
This subfolder contains the code for the Webassembly backend of the Smartwatch application and the javascript based experiments.
Cmake is used for compilation. Verified to work on Ubuntu/Linux with root priveleges.

The workspace is structured in three folders.
- `Geometry` contains function calls for Riemannian Geometry with covariance matrices. Uses the [RigByCpp](https://github.com/tmonseigne/RIGBy-cpp) library. 
- `Kernel` contains the main entry point that is compiled to Webassembly. The `src/webidl/webidl.idl` file contains the API for the javascript side.
- `third-party` contains the forks of the used third-party libraries, i.e. [Eigen](https://eigen.tuxfamily.org), [iir1](https://github.com/berndporr/iir1), and [RigByCpp](https://github.com/tmonseigne/RIGBy-cpp). Run `git submodule init` in the terminal to fetch the code of the third-party libraries.

## Compilation
Compilation is done by Cmake. In every subfolder sits a `CmakeLists.txt` file which contains the compilation logic. The `CmakeLists.txt` in the folder of this readme is the entry point. For building for execution on unix or windows modify the line `option(WEBIDL "export to js" ON)` to `OFF`, for targeting Webassembly set the option to `ON`. Consider making two separate build directories for both build options.
Furthermore, it is required to run 
```s
sudo ln -s ./third-party/Eigen-fork/include /usr/local/include
```
so the compiler can find the Eigen library.

### Targeting Unix/ Windows
This build mode will generate an executable file which will execute `Kernel/src/main.cpp`.

First create a build directory by
```s
mkdir build 
```
from the root directory (the directory of this readme file). `cd` into the build directory, then run 
```s
cmake ..
cmake --build .
```
Then `cd` into the debug directory and execute the generated executable from command line.

### Targeting Webassembly
This build mode will generate a .wasm file and, if specified, a .js glue file. These one or two files can be copied into a javascript application and used from there.
Build is only tested on an Unix Ubuntu system.
First, switch target to Webassembly by setting `option(WEBIDL "export to js" ON)` to `ON` in main CmakeLists.txt.

#### Emscripten installation
Since emscripten is used to compile C++ into Webassembly, follow the getting-started tutorial of Emscripten to install their [SDK](https://emscripten.org/docs/getting_started/downloads.html). The recommended installation way is also documented below.
```s
# Get the emsdk repo
git clone https://github.com/emscripten-core/emsdk.git

# Enter that directory
cd emsdk

# Fetch the latest version of the emsdk (not needed the first time you clone)
git pull

# Download and install the latest SDK tools.
./emsdk install latest

# Make the "latest" SDK "active" for the current user. (writes .emscripten file)
./emsdk activate latest
```

Furthermore, clone emscripten tools by 
```s
git clone https://github.com/emscripten-core/emscripten
```
in a folder of your choice. Let that folder be denoted by `$EMSCRIPTEN_FOL$`

#### Production build
First, activate PATH and other environment variables of Emscripten SDK in the current terminal by
```s
source ./emsdk_env.sh```
```
Second, generate glue files via:
```s
python $EMSCRIPTEN_FOL$/tools/webidl_binder.py Kernel/src/webidl/webidl.idl glue
```
Create build directory and cmake with Emscripten SDK
```s
mkdir wasm_build
cd wasm_build
emcmake cmake ..
```
Copy webidl glue files to build manually via 
```s
cp ../Kernel/src/webidl/glue.cpp /Debug/Kernel/src/ 
cp ../Kernel/src/webidl/glue.js /Debug/Kernel/src/ 
```
Finally, generate output by 
```s
emmake make
```
