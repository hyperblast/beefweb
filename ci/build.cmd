setlocal
cd "%~dp0.."

msbuild.exe scripts\build.proj ^
    /p:Platform=%BUILD_ARCH% /p:Configuration=%BUILD_TYPE% /p:EnableTests=True ^
    /p:BuildFlags="-DENABLE_GIT_REV=ON"
