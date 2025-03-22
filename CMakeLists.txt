cmake_minimum_required(VERSION 3.14)
project(blockchain_extensions)

# Find required packages
find_package(Python3 COMPONENTS Interpreter Development REQUIRED)
find_package(pybind11 CONFIG REQUIRED)
find_package(OpenSSL REQUIRED)

# Include directories
include_directories(
    ${Python3_INCLUDE_DIRS}
    ${pybind11_INCLUDE_DIRS}
    ${OPENSSL_INCLUDE_DIR}
)

# Set C++17 standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Set optimization flags for release builds
if(NOT CMAKE_BUILD_TYPE STREQUAL "Debug")
    if(MSVC)
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /O2")
    else()
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -O3")
    endif()
endif()

# Determine extension suffix based on platform
if(WIN32)
    set(EXTENSION_SUFFIX ".pyd")
else()
    execute_process(
        COMMAND ${Python3_EXECUTABLE} -c "import sysconfig; print(sysconfig.get_config_var('EXT_SUFFIX'))"
        OUTPUT_VARIABLE EXTENSION_SUFFIX
        OUTPUT_STRIP_TRAILING_WHITESPACE
    )
endif()

# Create blockchain_cpp module
add_library(blockchain_cpp MODULE 
    "${CMAKE_SOURCE_DIR}/cpp_extensions/blockchain_cpp.cpp"
)

# Link libraries for blockchain_cpp
target_link_libraries(blockchain_cpp 
    PRIVATE 
    pybind11::module 
    ${OPENSSL_LIBRARIES}
)

# Create utxo_cpp module
add_library(utxo_cpp MODULE 
    "${CMAKE_SOURCE_DIR}/cpp_extensions/utxo_cpp.cpp"
)

# Link libraries for utxo_cpp
target_link_libraries(utxo_cpp 
    PRIVATE 
    pybind11::module 
    ${OPENSSL_LIBRARIES}
)

# Set output properties for both modules
foreach(TARGET blockchain_cpp utxo_cpp)
    set_target_properties(${TARGET} PROPERTIES
        PREFIX ""
        SUFFIX "${EXTENSION_SUFFIX}"
        LIBRARY_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}"
    )
endforeach()