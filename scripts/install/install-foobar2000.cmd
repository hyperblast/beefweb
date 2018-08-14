setlocal

set target_dir=tools\foobar2000
set pkg_file=foobar2000_v1.3.17.exe

cd "%~dp0..\.."

if exist %target_dir%. (
    rmdir /s /q %target_dir%
    if errorlevel 1 goto :end
)

mkdir %target_dir%
if errorlevel 1 goto :end

cd %target_dir%
if errorlevel 1 goto :end

curl --silent --fail --show-error --location -o %pkg_file% ^
    "https://hyperblast.org/files/foobar2000/%pkg_file%"
if errorlevel 1 goto :end

echo.>portable_mode_enabled
if errorlevel 1 goto :end

%pkg_file% /S /D=%cd%
if errorlevel 1 goto :end

del %pkg_file%
if errorlevel 1 goto :end

xcopy /E /F /Y "%~dp0foobar2000" .
if errorlevel 1 goto :end

:end
