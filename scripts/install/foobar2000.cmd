@setlocal

@if "%1" == "v1.6" (
    @set pkg_file=foobar2000_v1.6.17.exe
    @goto :install
)

@if "%1" == "v2.0" (
    @set pkg_file=foobar2000_v2.0.exe
    @goto :install
)

@if "%1" == "v2.0-x64" (
    @set pkg_file=foobar2000-x64_v2.0.exe
    @goto :install
)

@if "%1" == "v2.1" (
    @set pkg_file=foobar2000_v2.1.6.exe
    @goto :install
)

@if "%1" == "v2.1-x64" (
    @set pkg_file=foobar2000-x64_v2.1.6.exe
    @goto :install
)

@if "%1" == "v2.24" (
    @set pkg_file=foobar2000_v2.24.2.exe
    @goto :install
)

@if "%1" == "v2.24-x64" (
    @set pkg_file=foobar2000-x64_v2.24.2.exe
    @goto :install
)

@echo Usage: %~nx0 version
@echo Supported versions: v1.6 v2.0 v2.0-x64 v2.1 v2.1-x64 v2.24 v2.24-x64
@cmd /c exit 1
@goto :end

:install

set target_dir=apps\foobar2000\%1

cd "%~dp0..\.."

if exist %target_dir%\. (
    rmdir /s /q %target_dir%
    @if errorlevel 1 goto :end
)

mkdir %target_dir%
@if errorlevel 1 goto :end

cd %target_dir%
@if errorlevel 1 goto :end

curl --silent --fail --show-error --location -o %pkg_file% ^
    "https://hyperblast.org/files/foobar2000/%pkg_file%"
@if errorlevel 1 goto :end

echo.>portable_mode_enabled
@if errorlevel 1 goto :end

%pkg_file% /S /D=%cd%
@if errorlevel 1 goto :end

del %pkg_file%
@if errorlevel 1 goto :end

xcopy /E /F /Y "%~dp0foobar2000\%1" .
@if errorlevel 1 goto :end

:end
