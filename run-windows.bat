@echo off
setlocal
cd /d "%~dp0"
title Carton Calculator Setup

echo.
echo ==========================================
echo       Carton Calculator - Local App
echo ==========================================
echo.

where py >nul 2>nul
if errorlevel 1 (
  echo Python is not installed or the Python Launcher is unavailable.
  echo Install Python 3 from https://www.python.org/downloads/
  echo During installation, tick "Add python.exe to PATH".
  echo Then run this file again.
  pause
  exit /b 1
)

if not exist ".venv\Scripts\python.exe" (
  echo Creating the local Python environment...
  py -3 -m venv .venv
  if errorlevel 1 goto :error
)

echo Checking pip inside the local environment...
".venv\Scripts\python.exe" -m pip --version >nul 2>nul
if errorlevel 1 (
  echo pip is missing in .venv. Repairing it now...
  ".venv\Scripts\python.exe" -m ensurepip --upgrade
  if errorlevel 1 goto :error
)

echo Installing or checking required packages...
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 goto :error

echo.
echo Opening http://127.0.0.1:8000
start "" "http://127.0.0.1:8000"
echo.
echo Keep this window open while using the app.
echo Press Ctrl+C here when you want to stop it.
echo.
".venv\Scripts\python.exe" server.py
exit /b 0

:error
echo.
echo Setup failed. Please copy the error shown above.
pause
exit /b 1
