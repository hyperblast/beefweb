@if "%1" == "" @goto :usage

xcopy /E /I /Y boost\* "%~f1\include\boost"
@if errorlevel 1 @goto :end

xcopy /I /Y stage\lib\*.lib "%~f1\lib"
@if errorlevel 1 @goto :end

@goto :end

:usage
@echo usage: %~nx0 target-dir
@echo.
@cmd /c exit 1

:end
