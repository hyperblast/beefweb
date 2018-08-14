setlocal
cd "%~dp0..\.."

set BEEFWEB_TEST_BUILD_TYPE=release
set BEEFWEB_USE_BEAST=1

server\build\release\src\tests\Release\core_tests.exe
if errorlevel 1 goto :end

pushd js\api_tests

yarn install
if errorlevel 1 goto :end

yarn test
if errorlevel 1 goto :end

popd

:end
