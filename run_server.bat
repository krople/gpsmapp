@echo off
echo ======================================
echo   GPS Memory Lock App - Local Server
echo ======================================
echo.
echo Starting web server on http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.
echo Open your browser and go to:
echo http://localhost:8000/login.html
echo.
echo ======================================
echo.

python -m http.server 8000
