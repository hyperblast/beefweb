setlocal
cd "%~dp0"

if "%APPVEYOR%" == "True" goto :appveyor
msbuild upload.proj
goto :end

:appveyor
if "%APPVEYOR_REPO_BRANCH%" neq "master" goto :skip
if "%APPVEYOR_PULL_REQUEST_NUMBER%" neq "" goto :skip
msbuild upload.proj /logger:"C:\Program Files\AppVeyor\BuildAgent\Appveyor.MSBuildLogger.dll"
goto :end

:skip
echo Not master branch build, skipping upload
goto :end

:end
