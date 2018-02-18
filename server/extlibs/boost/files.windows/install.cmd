:: Why custom installation script?

:: Standard install target copies single files with copy command which is very slow
:: Version prefix is added to installation directory which is unwanted
:: Libraries need to be renamed to have fixed name regardless of build options

@if "%1" == "" @goto :usage

xcopy /E /I /Y boost\* "%~f1\include\boost"
@if errorlevel 1 @goto :end

if not exist "%~f1\lib\." mkdir "%~f1\lib"
@if errorlevel 1 @goto :end

call :copylib "%1" libboost_system
@if errorlevel 1 @goto :end

call :copylib "%1" libboost_filesystem
@if errorlevel 1 @goto :end

call :copylib "%1" libboost_thread
@if errorlevel 1 @goto :end

@goto :end

:copylib
copy /B /Y stage\lib\%2*.lib "%~f1\lib\%2.lib"
@goto :end

:usage
@echo usage: %~nx0 target-dir
@echo.
@cmd /c exit 1

:end
