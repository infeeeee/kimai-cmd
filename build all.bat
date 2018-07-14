for /f "delims=" %%a in ('wmic OS Get localdatetime  ^| find "."') do set dt=%%a
set dt=%dt:~0,8%
echo %dt%
set startdir=%~dp0
cd %~dp0
md .\builds\%dt%-all .\builds\%dt%-all\macos .\builds\%dt%-all\win\bat .\builds\%dt%-all\linux
copy .\settings.ini.example .\builds\%dt%-all\macos\settings.ini
copy .\settings.ini.example .\builds\%dt%-all\win\settings.ini
copy .\settings.ini.example .\builds\%dt%-all\linux\settings.ini
copy .\bat\* .\builds\%dt%-all\win\bat
start "" /w cmd /c pkg --out-path .\builds\%dt%-all .\kimai-cmd.js
cd .\builds\%dt%-all
move kimai-cmd-linux linux\kimai-cmd
move kimai-cmd-macos macos\kimai-cmd
move kimai-cmd-win.exe win\kimai-cmd.exe
cd %startdir%