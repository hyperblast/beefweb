@if "%1" == "" goto :usage

@set src_dir=%~dp0%1
@set patches_dir=%src_dir%\patches
@set files_dir=%src_dir%\files

@if exist "%patches_dir%\." call :apply_patches
@if exist "%files_dir%\." call :copy_files
@goto :end

:apply_patches
@for %%f in (%patches_dir%\*.patch) do @(
    @echo applying %%~nxf
    @patch -p1 --binary < "%%f"
)
@goto :end

:copy_files
@xcopy /E /F /Y "%files_dir%\*" .
@goto :end

:usage
@echo usage: %~nx0 target
@echo.
@cmd.exe /c exit 1

:end
