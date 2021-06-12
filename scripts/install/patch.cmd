setlocal

set target_dir=tools\patch
set pkg_file=patch.zip

cd "%~dp0..\.."

if exist %target_dir%. (
    rmdir /s /q %target_dir%
    @if errorlevel 1 goto :end
)

mkdir %target_dir%
@if errorlevel 1 goto :end

cd %target_dir%
@if errorlevel 1 goto :end

curl --silent --fail --show-error --location -o %pkg_file% ^
    "https://hyperblast.org/files/patch/%pkg_file%"
@if errorlevel 1 goto :end

7z x %pkg_file%
@if errorlevel 1 goto :end

del %pkg_file%
@if errorlevel 1 goto :end

:end
