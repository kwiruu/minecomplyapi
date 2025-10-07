@echo off
REM IP Detection Script for MineComply Development (Windows)

echo 🔍 Finding your local IP address for mobile device testing...
echo.

REM Try to get IP from ipconfig
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4"') do (
    set "ip=%%i"
    goto :found
)

echo ⚠️  Could not detect IP automatically
echo 💡 Try running: ipconfig
goto :end

:found
REM Trim spaces from IP
for /f "tokens=* delims= " %%a in ("%ip%") do set ip=%%a

echo ✅ Your IP address: %ip%
echo.
echo 📝 Configuration needed:
echo.
echo 🖥️  Backend (minecomplyapi\.env):
echo CORS_ORIGINS=http://localhost:3000,http://%ip%:3000,http://localhost:19006
echo.
echo 📱 Mobile App (minecomplyapp\.env):
echo API_BASE_URL=http://%ip%:3000
echo.
echo 🔄 Don't forget to restart both servers after updating!

:end
echo.
echo 📖 For detailed instructions, see: IP_CONFIGURATION_GUIDE.md
pause