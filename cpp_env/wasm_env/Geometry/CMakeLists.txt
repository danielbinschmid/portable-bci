
# include_directories(include)
add_subdirectory(src)

target_include_directories(${GEOMETRY} PUBLIC "$<BUILD_INTERFACE:${CMAKE_CURRENT_LIST_DIR}/include>"
                                                      "$<INSTALL_INTERFACE:${CMAKE_INSTALL_INCLUDEDIR}>")


target_link_libraries(${GEOMETRY} LINK_PUBLIC ${EIGEN})
target_link_libraries(${GEOMETRY} LINK_PUBLIC ${RIGBYCPP})

