@echo off
title Smart Complaint Handler - Stop All Servers
color 0C

echo ===============================================================================
echo             STOPPING SMART COMPLAINT HANDLER SERVERS (8000 / 5173)
echo ===============================================================================
echo.

powershell -NoProfile -Command "$ports = @(8000, 5173); foreach ($p in $ports) { $c = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue; if ($c) { $pids = $c | Select-Object -ExpandProperty OwningProcess -Unique; foreach ($procId in $pids) { Write-Host ('[*] Terminating process on port ' + $p + ' (PID: ' + $procId + ')...'); Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue } } else { Write-Host ('[-] Port ' + $p + ' is free.') } }; Write-Host '[+] All servers stopped successfully.' -ForegroundColor Green"

echo.
echo ===============================================================================
echo  Done. Ports 8000 (FastAPI) and 5173 (Vite) are now released.
echo ===============================================================================
echo.
pause
