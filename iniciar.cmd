@echo off
REM ===========================================================
REM  BLOCK QUEST - abrir el juego en esta PC
REM  Doble clic aca. Abre Chrome solo.
REM ===========================================================
title Block Quest
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
  echo.
  echo   No encuentro Python en el PATH.
  echo   Proba abrir una consola nueva, o instala Python desde python.org
  echo.
  pause
  exit /b 1
)

python servir.py
pause
