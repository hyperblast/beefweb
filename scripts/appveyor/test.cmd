setlocal
cd "%~dp0..\.."

set BEEFWEB_TEST_BUILD_TYPE=release
set BEEFWEB_USE_BEAST=1

@echo.
@echo === Running server tests ===
@echo.
server\build\release\src\tests\Release\core_tests.exe
@if errorlevel 1 goto :end

@pushd js\api_tests

@echo.
@echo === Installing packages for API tests ===
@echo.
cmd /c yarn install
@if errorlevel 1 goto :end

@echo.
@echo === Running API tests ===
@echo.
cmd /c yarn test
@if errorlevel 1 goto :end

@popd

:end
