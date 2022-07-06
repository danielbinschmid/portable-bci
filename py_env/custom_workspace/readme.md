```s
conda env create -n my_env python=3.10.4
conda install -c conda-forge cudatoolkit=11.2 cudnn=8.1.0
mkdir -p $CONDA_PREFIX/etc/conda/activate.d
echo 'export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$CONDA_PREFIX/lib/' > $CONDA_PREFIX/etc/conda/activate.d/env_vars.sh
python3 -m pip install tensorflow
pip install scipy
pip install tqdm
```

Files are structured by prefix. 

a_ - Functions that are directly called by main.
n_ - Definitions of Neural Inspired Units
r_ - Methods to read data from files
u_ - General utils
z_ - Class system and data configuration


