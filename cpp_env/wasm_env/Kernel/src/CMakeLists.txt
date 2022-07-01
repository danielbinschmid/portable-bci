



if(NOT WEBIDL)
    # add_compile_options("/bigobj")
endif()
# -sUSE_ES6_IMPORT_META=0 -sENVIRONMENT='web,webview' -s SINGLE_FILE=1 --preload-file -O2 'node' 'web,webview'


if(WEBIDL)
    message("building for js")
	set(CMAKE_EXECUTABLE_SUFFIX ".js")
	add_executable(${MAIN_PROJECT} "webidl/glue.cpp" "RiemannKernel.cpp" "ArrayBuffer.cpp" "Timeseries.cpp" "Timetensor.cpp") 
	set_target_properties(${MAIN_PROJECT} PROPERTIES LINK_FLAGS " --post-js glue.js -O3 -sLLD_REPORT_UNDEFINED -s WASM=1 -s MODULARIZE=1 -s EXPORT_ES6=1 -sENVIRONMENT='node' -s USE_ES6_IMPORT_META=0 -s EXPORTED_FUNCTIONS=['_free'] -sALLOW_MEMORY_GROWTH" )
else()
    message("building for cpp")
	add_executable (${MAIN_PROJECT} "main.cpp" "RiemannKernel.cpp" "ArrayBuffer.cpp" "Timeseries.cpp" "Timetensor.cpp")
endif()

