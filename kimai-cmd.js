//variables
var verbose = false;
var endHang = false;

//global variables
var apiKey;
var projects = [];
var projectIDs = [];
var tasks = [];
var taskIDs = [];
var active = {};
var isActive = false;

//for settings
var settings = {};

//for rainmter
var rainmeterOption;

// for rpc
var client;

//node modules
//json rpc
var rpc = require('node-json-rpc');

//File system, path, child process
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

//ini
const ini = require('ini');

//commander
var program = require('commander');

//reading version number from package.json
var pjson = require('./package.json');

//functions

//wrap in quotes
String.prototype.qWrap = function () {
    var target = this;
    return '"' + target + '"';
};

//calling the server
function kimaiCall(method, param, callback) {
    console.log("Calling " + settings.kimai.serverUrl + ":" + settings.kimai.serverPort + " Method: " + method);
    client.call(
        { "jsonrpc": "2.0", "method": method, "params": param, "id": 0 },
        function (err, res) {
            if (err) {
                console.log("Error: " + err);
                return false;
            }
            else {
                if (res.result.success) {
                    console.log("->Success")
                } else {
                    console.log("->Negative")
                }
                if (res.result.items && verbose) {
                    for (var i = 0; i < res.result.items.length; i++) {
                        var element = res.result.items[i];
                        var itemKeys = Object.keys(element);
                        for (var j = 0; j < itemKeys.length; j++) {
                            var elem = itemKeys[j];
                            console.log("   " + elem + " " + element[elem])
                        }
                        console.log();
                    }
                } else if (res.result.error && verbose) {
                    console.log("Message: " + res.result.error.msg)
                }
                if (typeof callback === "function") {
                    callback(res);
                }
            }
        }
    )
}

//reading settings file, starting rpc, calling authentication
function kimaiAuthenticate(callback) {
    
    //different settings.ini path for developement and pkg version
    var settingsPath;
    var settingsPathPkg=path.join(path.dirname(process.execPath),'/settings.ini')
    var settingsPathNode=path.join(__dirname, '/settings.ini')
    
    if (fs.existsSync(settingsPathPkg)) {        
        var settingsPath=settingsPathPkg
    }else if(fs.existsSync(settingsPathNode)){
        var settingsPath=settingsPathNode
    }else{
        console.log("Error: settings.ini not found!")
        if(verbose){
            console.log("Searched locations:")
            console.log(settingsPathPkg)
            console.log(settingsPathNode)
        }
        return
    }

    settings = ini.parse(fs.readFileSync(settingsPath, 'utf-8'))

    var options = {
        port: settings.kimai.serverPort,
        host: settings.kimai.serverUrl,
        path: '/core/json.php',
        strict: true
    };

    client = new rpc.Client(options);

    kimaiCall("authenticate", [settings.kimai.username, settings.kimai.password], function (res) {
        if (res.result.success) {
            apiKey = res.result.items[0].apiKey;
            if (typeof callback === "function") {
                callback();
            }
        } else {
            console.log("Authentication error!!!")
        }
    })
}

//calling, get projects
function kimaiGetProjects(callback) {
    kimaiCall("getProjects", [apiKey], function (res) {
        if (res.result.success) {
            for (var i = 0; i < res.result.items.length; i++) {
                var element = res.result.items[i];
                projects[i] = element.name;
                projectIDs[i] = element.projectID;
            }
            if (typeof callback === "function") {
                callback();
            }
        } else {
            console.log("getProject error!!")
        }
    })
}

//calling, get tasks
function kimaiGetTasks(callback) {
    kimaiCall("getTasks", [apiKey], function (res) {
        if (res.result.success) {
            for (var i = 0; i < res.result.items.length; i++) {
                var element = res.result.items[i];
                tasks[i] = element.name;
                taskIDs[i] = element.activityID;
            }
            if (typeof callback === "function") {
                callback();
            }
        } else {
            console.log("getTasks error!!")
        }
    })
}

//calling, get active project and task
function kimaiGetActive(callback) {
    kimaiCall("getActiveRecording", [apiKey], function (res) {
        if (res.result.success) {
            // console.log(res.result.items[0].projectName)
            active.projectName = res.result.items[0].projectName;
            active.activityName = res.result.items[0].activityName;
            isActive = true;

            if (typeof callback === "function") {
                callback();
            }
        } else if (res.result.success == false && res.result.error.msg == 'No active recording.') {
            isActive = false;
            if (typeof callback === "function") {
                callback();
            }
        } else {

            console.log("getActiveRecording error!!")
        }
    })
}

//write rainmeter files
//This function needs a total rewrite, very chaotic and not enough options
function writeRainmeter() {
    // var writeFileData = "apiKey:" + apiKey + "\r\nprojects:" + projects + "\r\ntasks:" + tasks + "\r\nisActive:" + isActive + "\r\nactive:" + active;

    // fs.writeFile('kimaiStatus.ini', writeFileData, (err) => {
    //     if (err) throw err;
    //     console.log('The file has been saved!');
    // });
    console.log("\nwriting rainmeter files")
    var rainProject;
    var rainTask
    if (isActive == false) {
        rainProject = "No project"
        rainTask = "No task"
    } else {
        rainProject = active.projectName.qWrap()
        rainTask = active.activityName.qWrap()
    }

    var rainVars = "[Variables]\r\nserverUrl=http://" + settings.kimai.serverUrl + ":" + settings.kimai.serverPort + "/core/kimai.php\r\nactiveProject=" + rainProject + "\r\nactiveTask=" + rainTask + "\r\n\r\n"
    var rainData = "";

    rainData += "[MeterProjectTitle]\r\nMeter=String\r\nMeterStyle="+ settings.rainmeter.rainmeterStyleProjectsTitle +"\r\nDynamicVariables=1\r\nHidden=#MenuVis#\r\nText=Projects\r\n"

    for (var index = 0; index < projects.length; index++) {
        var element = projects[index].qWrap();
        rainData += "[MeterProject" + index + "]\r\nMeter=String\r\nMeterStyle="+ settings.rainmeter.rainmeterStyleProjects +"\r\nDynamicVariables=1\r\nHidden=#MenuVis#\r\nText=" + element
            + "\r\nleftmouseupaction=[!SetOption MeterProject" + index + " Prefix > ][!SetOption #activeProjectMeter# Prefix  \"\"][!SetVariable activeProjectMeter MeterProject" + index + "][!SetVariable activeProject " + element + "]\r\n"
        if (element == rainProject) {
            rainData += "Prefix=>"
            rainVars += "activeProjectMeter=MeterProject" + index + "\r\n\r\n"
        }
        rainData += "\r\n"
        // rainData = rainData + "project" + index + "=" + element + "\r\n"
    }

    rainData += "[MeterTaskTitle]\r\nMeter=String\r\nMeterStyle="+ settings.rainmeter.rainmeterStyleTasksTitle +"\r\nDynamicVariables=1\r\nHidden=#MenuVis#\r\nText=Tasks\r\n"

    for (var index = 0; index < tasks.length; index++) {
        var element = tasks[index].qWrap();
        rainData += "[MeterTask" + index + "]\r\nMeter=String\r\nMeterStyle="+ settings.rainmeter.rainmeterStyleTasks +"\r\nDynamicVariables=1\r\nHidden=#MenuVis#\r\nText=" + element
            + "\r\nleftmouseupaction=[!SetOption MeterTask" + index + " Prefix > ][!SetOption #activeTaskMeter# Prefix  \"\"][!SetVariable activeTaskMeter MeterTask" + index + "][!SetVariable activeTask " + element + "]\r\n"
        if (element == rainTask) {
            rainData += "Prefix=>"
            rainVars += "activeTaskMeter=MeterTask" + index + "\r\n\r\n"
        }
        rainData += "\r\n"
        // rainData = rainData + "task" + index + "=" + element + "\r\n"
    }

    if (!isActive) {
        rainVars += "activeProjectMeter=\r\n\r\n"
        rainVars += "activeTaskMeter=\r\n\r\n"
        rainVars += "stopHidden=1\r\nstartHidden=0\r\n\r\n"
    } else {
        rainVars += "stopHidden=0\r\nstartHidden=1"
    }


    fs.writeFile('kimaiVars.inc', rainVars, 'utf-16le', (err) => {
        if (err) throw err;
        console.log('kimaiVars.inc saved.');
    });

    fs.writeFile('kimaiData.inc', rainData, 'utf-16le', (err) => {
        if (err) throw err;
        console.log('kimaiData.inc saved.');
    });


}

//stops current recording
function kimaiStop(callback) {
    kimaiCall("stopRecord", [apiKey], function (res) {
        if (typeof callback === "function") {
            callback();
        }
    })
}

//prints nice lists in the console :)
function niceLog(varArray) {
    for (var i = 0; i < varArray.length; i++) {
        console.log("  " + varArray[i])
    }
}

//prints all project, task, actives
function kimaiList(rainmeter) {
    kimaiGetProjects(function () {
        kimaiGetTasks(function () {
            kimaiGetActive(function () {
                console.log("\nProjects:")
                niceLog(projects)
                console.log("\nTasks:")
                niceLog(tasks)
                if (isActive && active) {
                    console.log("\nActive: " + active.projectName + " - " + active.activityName)
                }else{
                    console.log("\nNo active recording.")
                }
                if (rainmeter) {
                    writeRainmeter();
                    exec('"' + settings.rainmeter.rainmeterExePath + '" !RefreshApp', (error, stdout, stderr) => {
                        if (error) {
                            console.error(`exec error: ${error}`);
                            return;
                        }
                        console.log("Refreshing rainmeter")
                    });
                    if (endHang) {
                        exec('pause');
                    }
                }
            })
        })
    })
}


function kimaiStart(project, task, callback) {

    if (verbose) {
        console.log("Starting... Project: " + project + " Task: " + task)
    }
    var projectNum;
    var taskNum;

    for (var i = 0; i < projects.length; i++) {
        var element = projects[i];
        if (verbose) {
            console.log("checking: " + element)
        }
        if (project == element) {
            projectNum = projectIDs[i];

            if (verbose) {
                console.log("found: " + projectIDs[i] + " - " + element)
            }
        }
    }
    for (var i = 0; i < tasks.length; i++) {
        var element = tasks[i];
        if (verbose) {
            console.log("checking: " + element)
        }
        if (task == element) {
            taskNum = taskIDs[i];
            if (verbose) {
                console.log("found: " + taskIDs[i] + " - " + element)
            }
        }
    }
    if (verbose) {
        console.log(project, projectNum, task, taskNum);
    }
    kimaiStop(function () {
        kimaiCall("startRecord", [apiKey, projectNum, taskNum], function (res) {
            if (verbose) {
                console.log(res);
            }
            if (typeof callback === "function") {
                callback();
            }
        })
    })
}


//commands, options

program
    .version(pjson.version)
    .description("Command line client for Kimai, the open source self-hosted timetracker")
    .option('-r, --rainmeter', '(re)write the rainmeter meters')
    .option('-v, --verbose', 'verbose, longer logging')
    .option('-e, --end', 'ctrl+c to exit, only works with -r')

program.command('start [project] [task]')
    .description('start selected project and task.')
    .action(function (startproject, starttask) {
        console.log("starting: " + startproject + ", " + starttask + " ");
        kimaiAuthenticate(function () {
            kimaiGetProjects(function () {
                kimaiGetTasks(function () {
                    kimaiStart(startproject, starttask, function () {
                        kimaiList(rainmeterOption);
                    })
                })
            })
        })
    })

program.command('stop')
    .description('stop current timer')
    .action(function () {
        kimaiAuthenticate(function () {
            kimaiStop(function () {
                kimaiList(rainmeterOption);
            });
        })
    })

program.command('list')
    .description('list all projects, tasks and actives')
    .action(function () {
        kimaiAuthenticate(function () {
            kimaiList(rainmeterOption);
        })
    })

program.parse(process.argv);


if (!program.args.length) program.help();

if (program.verbose) {
    verbose = true;
}

if (program.end) {
    endHang = true;
}

if (program.rainmeter) {
    rainmeterOption = true;
}