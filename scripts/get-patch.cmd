setlocal

cd "%~dp0.."

if exist tools\patch\. rmdir /s /q tools\patch
mkdir tools\patch
cd tools\patch

if errorlevel 1 goto :end

curl --silent --fail --show-error --location -o patch.zip ^
    "https://hyperblast.org/files/patch/patch.zip"
if errorlevel 1 goto :end

7z x patch.zip
if errorlevel 1 goto :end

del patch.zip
if errorlevel 1 goto :end

:end
