setlocal
cd "%~dp0.."

msbuild.cmd build.proj /p:Configuration=Release /p:ServerBuildFlags="-DENABLE_STATIC_STDLIB=ON"
