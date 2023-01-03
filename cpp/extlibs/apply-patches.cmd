@setlocal

@if "%1" == "" @goto :usage

@set src_dir=%~dp0%1
@set patch_tool_dir=%~dp0..\..\tools\patch

@if exist "%patch_tool_dir%\patch.exe" set PATH=%patch_tool_dir%;%PATH%

@call :apply_patches "%src_dir%\patches"
@if errorlevel 1 goto :error

@call :apply_patches "%src_dir%\patches.windows"
@if errorlevel 1 goto :error

@call :copy_files "%src_dir%\files"
@if errorlevel 1 goto :error

@call :copy_files "%src_dir%\files.windows"
@if errorlevel 1 goto :error

@goto :end

:apply_patches
@if not exist "%1\." @goto :end

@for %%f in (%1\*.patch) do @(
    @echo applying %%~nxf
    @patch.exe -p1 --batch --binary < "%%f"
    @if errorlevel 1 goto :error
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
