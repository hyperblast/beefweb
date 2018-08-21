@setlocal

@if "%1" == "" goto :usage
@if "%2" == "" goto :usage
@if "%3" == "" goto :usage

@set lib_dir=%3\lib

if not exist "%lib_dir%\." mkdir "%lib_dir%"
@if errorlevel 1 goto :end

cd "%lib_dir%"
@if errorlevel 1 goto :end

copy /B /Y "%2\win32\zlib.def" zlib1.def
@if errorlevel 1 goto :end

lib.exe /nologo /machine:"%1" /def:zlib1.def /out:zlib_dll.lib
@if errorlevel 1 goto :end

del zlib1.def
@if errorlevel 1 goto :end

@goto :end

:usage
@echo Usage: %~nx0 machine zlib_source_dir install_dir
@echo.
@cmd /c exit 1

:end
