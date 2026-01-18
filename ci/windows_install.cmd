setlocal

cd "%~dp0..js"

cmd /c yarn.cmd install
if errorlevel 1 goto :error

cd api_tests\src
node install_app.js patch
if errorlevel 1 goto :error

if "%BUILD_ARCH%" == "x64" (
    set VERSION_PATTERN=*-x64
) else (
    set VERSION_PATTERN=*-x32
)

node install_app.js foobar2000 %VERSION_PATTERN%
if errorlevel 1 goto :error

goto :end

:error
exit /b 1

:end
exit /b 0
