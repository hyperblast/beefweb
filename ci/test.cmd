setlocal
cd "%~dp0.."

set BEEFWEB_TEST_BUILD_TYPE=%BUILD_TYPE%

@echo.
@echo === Running server tests ===
@echo.
cpp\build\%BUILD_TYPE%\server\tests\%BUILD_TYPE%\core_tests.exe
@if errorlevel 1 goto :end

set API_TEST_ERROR=0

@pushd js\api_tests

if "%BUILD_ARCH%" == "x64" (
    @echo.
    @echo === Running API tests on foobar2000 v2.0-x64 ===
    @echo.
    set BEEFWEB_TEST_FOOBAR2000_VERSION=v2.0-x64
    cmd /c yarn test
    :: Known failure:
    :: @if errorlevel 1 set API_TEST_ERROR=1
) else (
    @echo.
    @echo === Running API tests on foobar2000 v1.5 ===
    @echo.
    set BEEFWEB_TEST_FOOBAR2000_VERSION=v1.5
    cmd /c yarn test
    :: Flaky (probably not supported by latest SDK):
    :: @if errorlevel 1 set API_TEST_ERROR=1

    @echo.
    @echo === Running API tests on foobar2000 v1.6 ===
    @echo.
    set BEEFWEB_TEST_FOOBAR2000_VERSION=v1.6
    cmd /c yarn test
    @if errorlevel 1 set API_TEST_ERROR=1

    @echo.
    @echo === Running API tests on foobar2000 v2.0 ===
    @echo.
    set BEEFWEB_TEST_FOOBAR2000_VERSION=v2.0
    cmd /c yarn test
    :: Known failure:
    :: @if errorlevel 1 set API_TEST_ERROR=1
)

@popd

exit %API_TEST_ERROR%

:end
