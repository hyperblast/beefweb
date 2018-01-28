if "%1" == "" goto :usage

xcopy /E /I /Y boost/* "%1/include/boost"
xcopy /E /I /Y stage/lib/*.lib "%1/lib"

:usage
@echo usage: %~nx0 target
@echo.
@cmd.exe /c exit 1

:end
