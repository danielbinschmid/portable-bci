To run Tensorflow on the CUDA GPU, follow the tutorial at https://emscripten.org/docs/optimizing/Optimizing-Code.html.
First, check that drivers are installed via `nvidia-smi`
Then, 
```s
conda create -n cudnn 
conda install -c conda-forge cudatoolkit=11.2 cudnn=8.1.0
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$CONDA_PREFIX/lib/
```
or for automation:
```s
mkdir -p $CONDA_PREFIX/etc/conda/activate.d
echo 'export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$CONDA_PREFIX/lib/' > $CONDA_PREFIX/etc/conda/activate.d/env_vars.sh
```

