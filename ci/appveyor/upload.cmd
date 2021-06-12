setlocal
cd "%~dp0..\.."

if "%APPVEYOR_REPO_BRANCH%" == "master" (
    cmd /c scripts\msbuild.cmd scripts\upload.proj /p:Configuration=%BUILD_TYPE%
) else (
    @echo Not master branch, skipping upload
)
