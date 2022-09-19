# portable-bci
This repository contains all the code written and used during a bachelor's thesis about `Usability driven design of learning algorithms on a wearable consumer-grade brain-computer interface`. Three different programming languages are used, javascript, C++, and python. Experimental comparisons are conducted, and a javascript based Smartwatch application is implemented. Main programming language is javascript; knowledge in C++ is helpful to understand the full digitial signal processing pipeline; the ecosystem of python is used 
to accelerate experiments.

Author: Daniel Bin Schmid <br />
Degree: B.Sc. Medieninformatik <br />
Mail: danielbinschmid@outlook.de <br />
Chair & supervisor: ITI/ STAR at Universität Stuttgart; Jun.- Prof. Hussam Amrouch  


## Content
Content is structured in four subfolders.
- `cpp_env` - C++ code. Digital signal processing with [iir1](https://github.com/berndporr/iir1), 
and Riemannian Geometry of covariance matrices with [RigByCpp](https://github.com/tmonseigne/RIGBy-cpp)

- `node_env` - NodeJs experiments with Node shell. Uses CUDA GPU to accelerate experiments. TensorflowJs is used to facilitate machine learning experiments.

- `py_env` - Machine learning experiments with python

- `watch_webapp` - The Smartwatch application, written in javascript. Implemented with Vue, Vuetify, and Cordova.

## Submodules
Remember to init submodules by 
```s
git submodule update --init --recursive
```
## Data
To download the datasets and move them into their according folders run the bash script `download_data.sh`