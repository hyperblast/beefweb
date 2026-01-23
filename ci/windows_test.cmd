setlocal

cd "%~dp0.."

set TEST_RETRY=1
set HAS_ERROR=0
set BEEFWEB_BINARY_DIR_BASE=ci_build
set BEEFWEB_TEST_BUILD_TYPE=%BUILD_TYPE%

@echo.
@echo === Running server tests ===
@echo.

ci_build\%BUILD_TYPE%\cpp\server\tests\%BUILD_TYPE%\core_tests.exe
if errorlevel 1 set HAS_ERROR=1

cd "%~dp0..\js\api_tests\src"

if "%BUILD_ARCH%" == "x64" (
    set VERSION_PATTERN=*-x64
) else (
    set VERSION_PATTERN=*-x32
)

for /F %%i in ('node install_app.js list-versions foobar2000 %VERSION_PATTERN%') do (
    @echo.
    @echo === Running API tests on foobar2000 %%i ===
    @echo.

    set BEEFWEB_TEST_FOOBAR2000_VERSION=%%i
    cmd /c yarn.cmd test --retry %TEST_RETRY%
    if errorlevel 1 set HAS_ERROR=1
)

exit /b %HAS_ERROR%
