#!/bin/sh

# set to true to download and unzip data automatically
# otherwise download data from link (TODO: insert link) and unzip in this folder manually.
if false 
then
    sudo apt install unrar
    echo "unrar installed"
    unrar e -r data.rar
    echo "compressed datafiles unzipped"
fi

# move datasets into folders where needed. 
if true 
then
    TARGET_DIR_NODEJS="node_env/evaluation/"
    # mkdir $TARGET_DIR_NODEJS
    mv data/node_env/data $TARGET_DIR_NODEJS

    TARGET_DIR_PYENV="py_env/custom_workspace/"
    # mkdir $TARGET_DIR_PYENV
    mv data/py_env/data $TARGET_DIR_PYENV

    echo "data moved into according directories" 
fi
