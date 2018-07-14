for /f "delims=" %%a in ('wmic OS Get localdatetime  ^| find "."') do set dt=%%a
set dt=%dt:~0,8%
echo %dt%
set startdir=%~dp0
cd %~dp0
md .\builds\%dt%-all .\builds\%dt%-all\kimai-cmd-macos64 .\builds\%dt%-all\kimai-cmd-win64\bat .\builds\%dt%-all\kimai-cmd-linux64
copy .\settings.ini.example .\builds\%dt%-all\kimai-cmd-macos64\settings.ini
copy .\settings.ini.example .\builds\%dt%-all\kimai-cmd-win64\settings.ini
copy .\settings.ini.example .\builds\%dt%-all\kimai-cmd-linux64\settings.ini
copy .\bat\* .\builds\%dt%-all\kimai-cmd-win64\bat
start "" /w cmd /c pkg --out-path .\builds\%dt%-all .\kimai-cmd.js
cd .\builds\%dt%-all
move kimai-cmd-linux kimai-cmd-linux64\kimai-cmd
move kimai-cmd-macos kimai-cmd-macos64\kimai-cmd
move kimai-cmd-win.exe kimai-cmd-win64\kimai-cmd.exe
cd %startdir%