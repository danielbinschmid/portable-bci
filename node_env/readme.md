# Node environment
Some machine learning experiments are written with NodeJs to facilitate the transport to the Smartwatch application.
- The `evaluation` folder contains code for the experiments
- `scripts` contains logic only used by the NodeJs shell experiments and not by the Smartwatch app
- `tools` is the analogous to the tools folder in the Smartwatch application. Hence, this folder shall be synced.
- `webapp_port` contains the runtime experiments for the Smartwatch  

## Setup
Yarn is assumed to be installed on the system. The code only works on a Unix system.
Navigate into the directory of 'index.js' and run 
```s
yarn
```
To run Tensorflow on the CUDA GPU, follow the tutorial at https://emscripten.org/docs/optimizing/Optimizing-Code.html or follow 
below instructions.
First, check that drivers are installed via `nvidia-smi`. The recommended way is via conda, which is assumed to be installed.
Then, 
```s
conda create -n cudnn 
conda install -c conda-forge cudatoolkit=11.2 cudnn=8.1.0
mkdir -p $CONDA_PREFIX/etc/conda/activate.d
echo 'export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$CONDA_PREFIX/lib/' > $CONDA_PREFIX/etc/conda/activate.d/env_vars.sh
```
## Usage
`index.js` is the main entry point. The files aren't written to work independently and must be called in `index.js`.
Execution of code can be done by the shell command 
```s
node index.js
```
from the same folder as `index.js`.




