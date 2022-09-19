#!/bin/sh
# wget -O data_bci.rar https://hidrive.ionos.com/api/sharelink/download?id=ZXCnICS4 # or download from https://hidrive.ionos.com/lnk/ZXCnICS4

DIR="./tmp/rar"
if [ -d "$DIR" ]; then
    echo "rar lib already fetched"
else
    echo "Fetching rar lib"
    mkdr tmp
    cd tmp
    wget https://www.rarlab.com/rar/rarlinux-5.5.0.tar.gz
    tar -zxvf rarlinux-*.tar.gz
    cd ..
fi
echo "unzipping data.."
./tmp/rar/unrar x data_bci.rar


TARGET_DIR_NODEJS="node_env/evaluation/"
mkdir $TARGET_DIR_NODEJS
mv data/node_env/data $TARGET_DIR_NODEJS

TARGET_DIR_PYENV="py_env/custom_workspace/"
mkdir $TARGET_DIR_PYENV
mv data/py_env/data $TARGET_DIR_PYENV

echo "data moved into according directories" 

rm -r ./data