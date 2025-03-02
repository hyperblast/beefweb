:: Copy binaries and config file from current build dir to foobar2000 profile

@setlocal

set PROFILE_DIR=%APPDATA%\foobar2000-v2
set COMPONENT_DIR=%PROFILE_DIR%\user-components-x64\foo_beefweb
set CONFIG_DIR=%PROFILE_DIR%\beefweb

@if [%BUILD_TYPE%] == [] set BUILD_TYPE=Debug

mkdir "%COMPONENT_DIR%"
mkdir "%CONFIG_DIR%"

cd "%~dp0..\build\%BUILD_TYPE%\cpp\server"

copy /Y foobar2000\%BUILD_TYPE%\*.* "%COMPONENT_DIR%"
copy /Y %BUILD_TYPE%\config.json    "%CONFIG_DIR%"
