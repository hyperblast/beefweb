@if "%UPLOAD_CREDS%" == "" (
    @echo UPLOAD_CREDS is not defined, aborting
    @cmd /c exit 1
) else (
    @curl --user %UPLOAD_CREDS% %*
)
