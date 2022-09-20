# Python machine learning experiments
This subfolder contains the code of the machine learning experiments written in python. Additionally, scripts for the visualizations generated are located in folder `/vis/`.

- `benchmarks` - Contains the results of the experiments.
- `data_utils` - Data transformation and data reading utils.
- `evaluation` - Experiment scripts.
- `nn_utils` - Architectures of neural networks. 
## Setup
```s
conda create -n thesis python=3.10.4
conda activate thesis
conda install -c conda-forge cudatoolkit=11.2 cudnn=8.1.0
mkdir -p $CONDA_PREFIX/etc/conda/activate.d
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$CONDA_PREFIX/lib/
echo 'export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$CONDA_PREFIX/lib/' > $CONDA_PREFIX/etc/conda/activate.d/env_vars.sh
python3 -m pip install tensorflow
pip install scipy
pip install tqdm
pip install mne
pip install pandas
pip install sklearn
```

## Use
Navigate into the `evaluation/` directory and execute the desired python script by calling 
```s
python e_example.py
```

## Experiment documentation
Documented in `./benchmarks/push/readme.md`

## Filename prefix glossary
a_ - Functions that are directly called by main. <br >
n_ - Definitions of Neural Inspired Units <br >
r_ - Methods to read data from files <br >
u_ - General utils <br >
z_ - Python classes and data configuration <br >





