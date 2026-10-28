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

# Unix: forward to the named script next to this file. Only shell built-ins are used to find
# it and to find bash, so this still works when PATH is empty or broken.
case "$0" in
  */*) script_dir=${0%/*} ;;
  *) script_dir=. ;;
esac
script_dir="$(cd "$script_dir" && pwd)"
for candidate in bash /bin/bash /usr/bin/bash; do
  if command -v "$candidate" >/dev/null 2>&1; then
    exec "$candidate" "${script_dir}/$1"
  fi
done
echo "14All: bash was not found, so the $1 hook did not run" >&2
exit 0
