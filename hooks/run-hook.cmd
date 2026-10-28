: << 'CMDBLOCK'
@echo off
REM Windows entry point (best-effort, untested): find bash and run the named hook script.
REM If bash is not found, exit 0 so the session is not blocked.
setlocal
set "HOOK=%~dp0%~1"
where bash >nul 2>nul
if %errorlevel%==0 (
  bash "%HOOK%"
  exit /b %errorlevel%
)
if exist "C:\Program Files\Git\bin\bash.exe" (
  "C:\Program Files\Git\bin\bash.exe" "%HOOK%"
  exit /b %errorlevel%
)
exit /b 0
CMDBLOCK

# Unix: forward to the named script next to this file.
script_dir="$(cd "$(dirname "$0")" && pwd)"
exec bash "${script_dir}/$1"
