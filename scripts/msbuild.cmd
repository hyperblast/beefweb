@if "%APPVEYOR%" == "True" (
    @msbuild.exe /logger:"C:\Program Files\AppVeyor\BuildAgent\Appveyor.MSBuildLogger.dll" %*
) else (
    @msbuild.exe %*
)
