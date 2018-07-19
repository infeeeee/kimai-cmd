# kimai-cmd

A command line client for [Kimai](http://www.kimai.org/), the open source self hosted timetracker.
This program was created to be used with the rainmeter skin [kimai-widget](https://github.com/infeeeee/kimai-widget) on Windows.

To use this program you have to install Kimai first!

More info on Kimai:
* [kimai.org](http://www.kimai.org/)
* [github](https://github.com/kimai/kimai)

## Features

* List all projects, activities
* List currently active project and activity
* Start/stop a project and activity
* Access server via SSL
* Generate settings for Rainmeter (Rainmeter is Windows only)
* Automatically stop timer when nobody uses the computer or when user logs off (Windows only) 

## Installing

### Windows

* Download from [releases](https://github.com/infeeeee/kimai-cmd/releases/latest)
* Extract
* Edit settings.ini
* `kimai-cmd list`
* [Optional] Automatic stop of the current timer when the PC is idle, via task scheduler: edit kimaiStop.xml in \bat. In the `<exec>` section change the path to your kimai-cmd.exe. Run installTask.bat to install the scheduled task for stop when idle or logoff. to remove the task, run removeTask.bat
* [Optional, experimental] add to path: `setx path "%path%;path-to-exe\"` remove from path: `setx PATH=%PATH:path-to-exe;=%` use them with caution!

### Linux/Mac

* Download from [releases](https://github.com/infeeeee/kimai-cmd/releases/latest)
* Extract
* Edit settings.ini
* `sudo chmod +x kimai-cmd`
* `kimai-cmd list`
* Symlink, so  you can use anywhere in the console: `sudo ln -s "$(pwd)/kimai-cmd" /usr/bin`
* To remove the symlink (uninstall): `sudo rm /usr/bin/kimai-cmd`

### Developement version

* Install node js for your OS
* Download source your favourite way
```
cd kimai-cmd
npm install
cp settings.ini.example settings.ini
nano settings.ini
node kimai-cmd list
```
* On windows you can build all versions with the `build all.bat`, if [pkg](https://www.npmjs.com/package/pkg) installed


## Usage

Kimai-cmd is command line only. 
You have to set up settings.ini first!
You can use multiple options.

Usage: kimai-cmd [options] [command]

  Options:

    -V, --version    output the version number
    -r, --rainmeter  initialize the client, (re)write the rainmeter meters.
    -v, --verbose    verbose, longer logging
    -e, --end        do not close window after finishing. press ctrl+c to exit
    -h, --help       output usage information


  Commands:

    start [project] [task]  start selected project and task.
    stop                    stop current timer
    list                    list all projects, tasks and actives

### Examples

Start time tracking for project called 'foo' and for activity 'bar':
```
kimai-cmd start foo bar
```

If the names contain spaces, wrap in quotation marks. This example has the same effect as the previous:
```
kimai-cmd start "foo" "bar"
```

If you use it with Rainmeter, allways use the -r option
```
kimai-cmd -r start foo bar
```

Use list to reload the rainmeter widget
```
kimai-cmd -r list
```

## Authors

infeeeee - gyetpet@gmail.com

## License

This project is licensed under the terms of the MIT license.