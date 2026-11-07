@echo off
rem ============================================================
rem  bump-version.bat — поднимает ВСЕ ?v=N в index.html до max+1.
rem  Запускай перед каждым коммитом, если менял js/css.
rem  Лежит в корне репо, работает по относительному пути.
rem ============================================================
cd /d "%~dp0"
powershell -NoProfile -Command "$c=[System.IO.File]::ReadAllText('index.html'); $ms=[regex]::Matches($c,'\?v=(\d+)'); if($ms.Count -eq 0){ Write-Host 'No ?v= found in index.html'; exit 1 }; $max=0; foreach($m in $ms){ if([int]$m.Groups[1].Value -gt $max){$max=[int]$m.Groups[1].Value} }; $n=$max+1; $c=[regex]::Replace($c,'\?v=\d+',('?v='+$n)); [System.IO.File]::WriteAllText('index.html',$c,(New-Object System.Text.UTF8Encoding($false))); Write-Host 'OK: all ?v= bumped to' $n"
pause
