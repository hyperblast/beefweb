setlocal
cd "%~dp0.."

if "%APPVEYOR_REPO_BRANCH%" == "master" (
    msbuild.cmd upload.proj /p:Configuration=Release
) else (
    @echo Not master branch, skipping upload
)
