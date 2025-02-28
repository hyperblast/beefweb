@setlocal
@cd "%~dp0.."

@if [%BUILD_TYPE%] == [] (
    @echo BUILD_TYPE is not set, aborting
    @cmd /c "exit 1"
    goto :end
)

@echo.
@echo === Cleaning build directory ===
@echo.
rmdir /S /Q ci_build\%BUILD_TYPE%
mkdir ci_build\%BUILD_TYPE%
cd ci_build\%BUILD_TYPE%
@if errorlevel 1 goto :end

@echo.
@echo === Configuring ===
@echo.
cmake ../.. -DENABLE_TESTS=ON -DENABLE_GIT_REV=ON
@if errorlevel 1 goto :end

@echo.
@echo === Building ===
@echo.
cmake --build . --config %BUILD_TYPE%
@if errorlevel 1 goto :end

@echo.
@echo === Creating packages ===
@echo.
cpack -C %BUILD_TYPE%
@if errorlevel 1 goto :end

ren *.zip *.fb2k-component

:end
