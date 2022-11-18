cmake_minimum_required(VERSION 3.0)

project(ea-launcher-sciter)
set(CMAKE_CXX_STANDARD 17)

if(UNIX AND NOT APPLE)
  find_package(PkgConfig REQUIRED)
  pkg_check_modules(GTK3 REQUIRED gtk+-3.0)
  include_directories(${GTK3_INCLUDE_DIRS})
  link_directories(${GTK3_LIBRARY_DIRS})
  add_definitions(${GTK3_CFLAGS_OTHER})
  set(LIBRARIES ${LIBRARIES} ${GTK3_LIBRARIES})
endif()

include_directories(extlibs/sciter-js-sdk/include)

file(GLOB SOURCES src/*.cpp)

add_subdirectory(extlibs/elzip)

add_executable(ea-launcher-sciter ${SOURCES})

if(WIN32)
  set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -static-libgcc -static-libstdc++ -static -mwindows -municode")
  target_sources(ea-launcher-sciter PRIVATE ver.rc)
endif()


# Compile resources into reosurces.cpp with sciter packer
if(UNIX AND NOT APPLE)
add_custom_command(
  TARGET ea-launcher-sciter
  PRE_BUILD
  COMMAND ./packfolder
  ARGS ${CMAKE_SOURCE_DIR}/ui/ ${CMAKE_SOURCE_DIR}/src/resources.cpp -v "resources"
  WORKING_DIRECTORY
  ${CMAKE_SOURCE_DIR}/extlibs/sciter-js-sdk/bin/linux/
)
endif()
if(WIN32)
add_custom_command(
  TARGET ea-launcher-sciter
  PRE_BUILD
  COMMAND packfolder.exe
  ARGS ${CMAKE_SOURCE_DIR}/ui/ ${CMAKE_SOURCE_DIR}/src/resources.cpp -v "resources"
  WORKING_DIRECTORY
  ${CMAKE_SOURCE_DIR}/extlibs/sciter-js-sdk/bin/windows/
)
endif()

target_link_libraries(ea-launcher-sciter ${LIBRARIES} elzip)


#install(TARGETS ea-launcher-sciter RUNTIME DESTINATION bin)
