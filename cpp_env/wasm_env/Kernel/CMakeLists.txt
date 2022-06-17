include_directories(include)
# find_package(iir REQUIRED)

add_subdirectory(src)

target_link_libraries(${MAIN_PROJECT} LINK_PUBLIC ${EIGEN})
target_link_libraries(${MAIN_PROJECT} LINK_PUBLIC ${GEOMETRY})
target_link_libraries(${MAIN_PROJECT} LINK_PUBLIC iir::iir_static)
target_link_libraries(${MAIN_PROJECT} LINK_PUBLIC ${RIGBYCPP})