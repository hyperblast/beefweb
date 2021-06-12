setlocal
cd "%~dp0..\.."

scripts\msbuild.cmd scripts\build.proj ^
    /p:Configuration=%BUILD_TYPE% /p:EnableTests=True ^
    /p:ServerBuildFlags="-DENABLE_STATIC_STDLIB=OFF;-DENABLE_GIT_REV=ON"
