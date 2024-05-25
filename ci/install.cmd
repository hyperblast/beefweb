setlocal
cd "%~dp0.."

cmd /c scripts\install\patch.cmd
@if errorlevel 1 goto :end

if "%BUILD_ARCH%" == "x64" (
    cmd /c scripts\install\foobar2000.cmd v2.0-x64
    @if errorlevel 1 goto :end

    cmd /c scripts\install\foobar2000.cmd v2.1-x64
    @if errorlevel 1 goto :end
) else (
    cmd /c scripts\install\foobar2000.cmd v1.6
    @if errorlevel 1 goto :end

    cmd /c scripts\install\foobar2000.cmd v2.0
    @if errorlevel 1 goto :end

    cmd /c scripts\install\foobar2000.cmd v2.1
    @if errorlevel 1 goto :end
)

:end
