
First, activate emsdk:
run
```shell
source ~/emsdk/emsdk_env.sh
```

Second, generate glue files via:
```s
python /home/daniel/emscripten/tools/webidl_binder.py webidl.idl glue
```

Make sure, that the header of the source code is correctly linked with glue.cpp. 


Then, glue together:
```s
emcmake cmake .
emmake make
```

Alternatively, glue via emcc:
```s
emcc glue.cpp -I /mnt/d/bachelor-thesis/cpp/NeuralInspiredUnit/third-party/Eigen/include --post-js glue.js -s ERROR_ON_UNDEFINED_SYMBOLS=0 -o output.js --verbose
```


Accessing array from pointer 
```js
Module.onRuntimeInitialized = () => {
    var x = new Module.ArrayBuffer_d(5, [1.0, 2.0, 3.0, 4.0, 5.0]);
    console.log(x.data);


    let ptr = Module.getPointer(x.data);
    console.log(ptr)
    let size = x.get_length();
    // You can use Module['env']['memory'].buffer instead. They are the same.
    let my_uint8_buffer = new Float64Array(wasmMemory.buffer, ptr, size);
    
    console.log(my_uint8_buffer);
}
```
