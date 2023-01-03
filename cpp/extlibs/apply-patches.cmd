@if "%1" == "" @goto :usage

@set src_dir=%~dp0%1

@call :apply_patches "%src_dir%\patches"
if %errorlevel% neq 0 goto :error
@call :apply_patches "%src_dir%\patches.windows"
if %errorlevel% neq 0 goto :error
@call :copy_files "%src_dir%\files"
if %errorlevel% neq 0 goto :error
@call :copy_files "%src_dir%\files.windows"
if %errorlevel% neq 0 goto :error

@goto :end

:apply_patches
@if not exist "%1\." @goto :end

@for %%f in (%1\*.patch) do @(
    @echo applying %%~nxf
    @patch -p1 --batch --binary < "%%f"
    @if errorlevel 1 goto :end
)

@goto :end

:copy_files
@if not exist "%1\." @goto :end
@xcopy /E /F /Y "%1\*" .
@goto :end

:usage
@echo usage: %~nx0 target
@echo.
@exit /b 1

:error
@exit /b %errorlevel%

:end
