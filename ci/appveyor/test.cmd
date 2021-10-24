setlocal
cd "%~dp0..\.."

set BEEFWEB_TEST_BUILD_TYPE=%BUILD_TYPE%

@echo.
@echo === Running server tests ===
@echo.
server\build\%BUILD_TYPE%\src\tests\%BUILD_TYPE%\core_tests.exe
@if errorlevel 1 goto :end

@pushd js\api_tests

@echo.
@echo === Running API tests on foobar2000 v1.3 ===
@echo.
set BEEFWEB_TEST_FOOBAR2000_VERSION=v1.3
cmd /c yarn test
@if errorlevel 1 goto :end

@echo.
@echo === Running API tests on foobar2000 v1.4 ===
@echo.
set BEEFWEB_TEST_FOOBAR2000_VERSION=v1.4
cmd /c yarn test
@if errorlevel 1 goto :end

@echo.
@echo === Running API tests on foobar2000 v1.5 ===
@echo.
set BEEFWEB_TEST_FOOBAR2000_VERSION=v1.5
cmd /c yarn test
@if errorlevel 1 goto :end

@echo.
@echo === Running API tests on foobar2000 v1.6 ===
@echo.
set BEEFWEB_TEST_FOOBAR2000_VERSION=v1.6
cmd /c yarn test
@if errorlevel 1 goto :end

@popd

:end
