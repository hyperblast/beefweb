setlocal
cd "%~dp0.."

set BEEFWEB_BINARY_DIR_BASE=ci_build
set BEEFWEB_TEST_BUILD_TYPE=%BUILD_TYPE%

@echo.
@echo === Running server tests ===
@echo.
ci_build\%BUILD_TYPE%\cpp\server\tests\%BUILD_TYPE%\core_tests.exe
@if errorlevel 1 goto :end

set API_TEST_ERROR=0

@pushd js\api_tests

@if "%BUILD_ARCH%" == "x64" (
    @echo.
    @echo === Running API tests on foobar2000 v2.0-x64 ===
    @echo.
    set BEEFWEB_TEST_FOOBAR2000_VERSION=v2.0-x64
    cmd /c yarn test
    @if errorlevel 1 set API_TEST_ERROR=1

    @echo.
    @echo === Running API tests on foobar2000 v2.1-x64 ===
    @echo.
    set BEEFWEB_TEST_FOOBAR2000_VERSION=v2.1-x64
    cmd /c yarn test
    @if errorlevel 1 set API_TEST_ERROR=1

    @echo.
    @echo === Running API tests on foobar2000 v2.24-x64 ===
    @echo.
    set BEEFWEB_TEST_FOOBAR2000_VERSION=v2.24-x64
    cmd /c yarn test
    @if errorlevel 1 set API_TEST_ERROR=1
) else (
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
    @if errorlevel 1 set API_TEST_ERROR=1

    @echo.
    @echo === Running API tests on foobar2000 v2.1 ===
    @echo.
    set BEEFWEB_TEST_FOOBAR2000_VERSION=v2.1
    cmd /c yarn test
    @if errorlevel 1 set API_TEST_ERROR=1

    @echo.
    @echo === Running API tests on foobar2000 v2.24 ===
    @echo.
    set BEEFWEB_TEST_FOOBAR2000_VERSION=v2.24
    cmd /c yarn test
    @if errorlevel 1 set API_TEST_ERROR=1
)

@popd

exit %API_TEST_ERROR%

:end
