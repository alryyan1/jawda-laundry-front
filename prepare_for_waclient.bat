@echo off
echo Preparing files for waclient.com upload...
echo.

REM Create a clean zip file for waclient.com
echo Creating zip file for easy upload...
powershell -Command "Compress-Archive -Path 'dist\*' -DestinationPath 'laundry-app-for-waclient.zip' -Force"

echo.
echo Files prepared successfully!
echo.
echo Next steps:
echo 1. Go to https://waclient.com/file_manager
echo 2. Login to your account
echo 3. Upload the file: laundry-app-for-waclient.zip
echo 4. Extract the zip file on waclient.com
echo 5. Get the shareable link for index.html
echo 6. Send that link via WhatsApp to 249991961111
echo.
echo Your zip file is ready: laundry-app-for-waclient.zip
pause
