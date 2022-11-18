import * as sys from "@sys";
import * as sciter from "@sciter";
import * as env from "@env";

function log(str)
{
  const plaintext = document.$("output");

  plaintext.append(str);
  console.log(str);
}

const selfVersion = "3";
const versionFile = ".ver";
var newestUrl;
var newestSize;
var pendingVersion;
const apiUrl = "http://endless-adventures.ddns.net/api/api.php?request=versions";
const topPlayersApiUrl = "http://endless-adventures.ddns.net/api/top.php?num=200";
const launcherApiUrl = "http://endless-adventures.ddns.net/api/api.php?request=launcher_update&version=";

async function RemoveOldArchive()
{
    while(sys.fs.$stat("eve.zip"))
        await sys.fs.unlink("eve.zip");
}

async function ShouldUpdateSelf() {
    log(Window.this.frame.getFirstArg());
    if(Window.this.frame.getFirstArg() == "update_self") {
        log("FROM CLIENT: update_self");
        //if(sys.fs.$stat("endless-adventures"))
            //sys.fs.unlink("endless-adventures");
        //if(sys.fs.$stat("endless-adventures.exe"))
            await sys.fs.unlink("endless-adventures.exe");
        await sys.fs.copyfile("launcher_update.exe", "endless-adventures.exe");
        env.exec("endless-adventures.exe", "updated");
        Window.this.close(0);
    }
    if(Window.this.frame.getFirstArg() == "updated") {
        log("FROM CLIENT: updated");
        //if(sys.fs.$stat("launcher_update"))
            //sys.fs.unlink("launcher_update");
        while(sys.fs.$stat("launcher_update.exe"))
        {
            sys.fs.unlink("launcher_update.exe");
        }

    }
}

async function GetTopPlayers() {
    const response = await fetch(topPlayersApiUrl, {
            headers: { "user-agent": "maiku-launcher" },
        });
    if(response.ok) {
        let num = 1;
        let topPlayers = JSON.parse(response.text());
        topPlayers.forEach((player, index) => {
            if(player["name"] == "anger")
                return;
            let newTopPlayerDiv = document.createElement('div');
            newTopPlayerDiv.classList.add('top-player-item');

            let newTopPlayerNumDiv = document.createElement('div');
            newTopPlayerNumDiv.classList.add('top-number');
            newTopPlayerDiv.appendChild(newTopPlayerNumDiv);
            let newTopPlayerNumberText = document.createTextNode(`${num++}`);
            newTopPlayerNumDiv.appendChild(newTopPlayerNumberText);

            let newTopPlayerNameDiv = document.createElement('div');
            let newTopPlayerNameText = document.createTextNode(player["name"]);
            newTopPlayerNameDiv.classList.add('top-name');
            newTopPlayerDiv.appendChild(newTopPlayerNameDiv);
            newTopPlayerNameDiv.appendChild(newTopPlayerNameText);

            let newTopPlayerTitleDiv = document.createElement('div');
            let newTopPlayerTitleText = document.createTextNode(player["title"]);
            newTopPlayerTitleDiv.classList.add('top-title');
            newTopPlayerDiv.appendChild(newTopPlayerTitleDiv);
            newTopPlayerTitleDiv.appendChild(newTopPlayerTitleText);

            let newTopPlayerLevelDiv = document.createElement('div');
            let newTopPlayerLevelText = document.createTextNode(`${player["level"]}`);
            newTopPlayerLevelDiv.classList.add('top-level');
            newTopPlayerDiv.appendChild(newTopPlayerLevelDiv);
            newTopPlayerLevelDiv.appendChild(newTopPlayerLevelText);
            newTopPlayerLevelDiv.title = `${player["exp"]}` + " EXP";

            document.getElementById("top-players-box").appendChild(newTopPlayerDiv);
        })
    }
}

async function CheckVersion() {

    ShouldUpdateSelf();
    try {
        // fetch newest launcher version
        const launcherResponse = await fetch(launcherApiUrl + `${selfVersion}`, {
                headers: { "user-agent": "maiku-launcher" },
        });
        if(launcherResponse.text() != "false" && launcherResponse.ok){
            log("update_avail");
            var launcherVersions = JSON.parse(launcherResponse.text());
            const launcherUpdate = await fetch(launcherVersions[0]["url"], {
                headers: { "user-agent": "maiku-launcher" },
                downloadProgress: function(downloadedBytes, totalBytes) {
                    OnDownloadProgress(downloadedBytes, newestSize);
                }
            });
            const launcherBuffer = await launcherUpdate.arrayBuffer();

            let file = await sys.fs.open("launcher_update.exe", "w+", 0o666);

            await file.write(launcherBuffer);

            await file.close();
    //         await env.exec("chmod", "777", "launcher_update");
    //         await env.launch("chmod 777 launcher_update")
            env.exec("launcher_update.exe", "update_self");
            await Window.this.close(0);
        }
    }
    catch(e) { /* web server error */ }



    // fetch version info from web api as json (array is always newest -> oldest version as per api)
    const response = await fetch(apiUrl, {
        headers: { "user-agent": "maiku-launcher" },
    });
    var versions = JSON.parse(response.text());

    // delete previously downloaded zip if it exists
    RemoveOldArchive();


    // create version file if it doesn't exist yet and set it to version 0
    if(!sys.fs.$stat(versionFile)) {
        const file = await sys.fs.open(versionFile, "w+", 0o666);
        await file.write("0");
        await file.close();
    }

    // read local version
    let arrayBuffer = sys.fs.$readfile(versionFile);
    var currVersion = sciter.decode(arrayBuffer, "utf-8");

    if(currVersion != versions[0]["version"] || !sys.fs.$stat("game/")) {
        // create game directory if it doesn't exist yet
        if(!sys.fs.$stat("game/"))
            await sys.fs.mkdir("game/");
        newestUrl = versions[0]["url"];
        newestSize = versions[0]["size"];
        try{
            const response = await fetch(newestUrl, {
                headers: { "user-agent": "maiku-launcher" },
                downloadProgress: function(downloadedBytes, totalBytes) {
                    OnDownloadProgress(downloadedBytes, newestSize);
                }
            });

            const buffer = await response.arrayBuffer();

            let file = await sys.fs.open("eve.zip", "w+", 0o666);

            await file.write(buffer);

            await file.close();
            document.getElementById("loading-fill").style.width = "*";
            pendingVersion = versions[0]["version"];

            // make a backup of the config folder before extracting the update
            if(sys.fs.$stat("game/config/"))
            {
                await sys.fs.rename("game/config/", "game/config_backup/");
            }
            if(sys.fs.$stat("game/maps/"))
            {
                await sys.fs.rename("game/maps/", "game/maps_backup/");
            }

            Window.this.frame.extractUpdate();
        } catch (e) {
            log("error: " + e);
        }
    }
    else {
        // ready to play
        document.getElementById("loading-fill").style.width = "*";
        //document.getElementById("play-button").style.transform = "scale(1)";
        //document.getElementById("loading-container").style.visibility = "hidden";
        document.getElementById("progress-div").style.visibility = "hidden";
        //document.getElementById("loading-container").style.width = "0";
    }
}

async function extractionFinished() {
    RemoveOldArchive();
    const file = await sys.fs.open(versionFile, "w+", 0o666)
    await file.write(`${pendingVersion}`);
    await file.close();

    // restore the config folder backup if there is one
    if(sys.fs.$stat("game/config_backup/"))
    {
        if(sys.fs.$stat("game/config/"))
        {
            sys.fs.$readdir("game/config/").forEach(file => {
                await sys.fs.unlink("game/config/" + file.name);
            });
            await sys.fs.rmdir("game/config/");
        }
        await sys.fs.rename("game/config_backup/", "game/config/");
    }
    if(sys.fs.$stat("game/maps_backup/"))
    {
        if(sys.fs.$stat("game/config/"))
        {
            sys.fs.$readdir("game/maps/").forEach(file => {
                await sys.fs.unlink("game/maps/" + file.name);
            });
            await sys.fs.rmdir("game/maps/");
        }
        await sys.fs.rename("game/maps_backup/", "game/maps/");
    }

    //document.getElementById("play-button").style.transform = "scale(1)";
    //document.getElementById("loading-container").style.visibility = "hidden";
    //document.getElementById("loading-container").style.width = "0";
    document.getElementById("progress-div").style.visibility = "hidden";
    PlayGame();
}
globalThis.extractionFinished = extractionFinished;

document.ready = function() {
    // calling native method defined in main.cpp
    const thisWindow = Window.this;
    //document.body.innerText = thisWindow.frame.nativeMessage();

    // get screen dimensions
    const [w, h] = Window.this.screenBox("frame", "dimension");

    // calculate screen center
    let x = w / 2;
    let y = h / 2;

    // get window dimensions with border
    const [wx, wy, ww, wh] = Window.this.box("rectw", "border", "screen", true);

    // calculate window top left corner
    const left = x - ww / 2;
    const top = y - wh / 2;
    Window.this.move(left, top, 1000, 560)

    CheckVersion();
    GetTopPlayers();
}


function OnDownloadProgress(downloadedBytes, totalBytes) {
    document.getElementById("progress-div").innerHTML = Math.round(100 * downloadedBytes / totalBytes) + "%";
    document.getElementById("progress-div").style.left = "calc(" + Math.round(100 * downloadedBytes / totalBytes) + "%)";
     document.getElementById("loading-fill").style.width = "calc(" + Math.round(100 * downloadedBytes / totalBytes) + "%)";
}

async function PlayGame() {
    Window.this.frame.switchToGameDirectory();
    await env.launch("Endless.exe");
    Window.this.frame.switchToExecDirectory();
}

document.getElementById("play-button").onclick = async function() {
    PlayGame();
};

document.getElementById("discord-link").onclick = async function() {
    //env.launch("https://discord.gg/34HqRDx429");
};

document.getElementById("youtube-link").onclick = async function() {
    //env.launch("https://www.youtube.com/channel/UCNnByakUqc79kPK5X7KuCdg");
};

document.getElementById("twitter-link").onclick = async function() {
    //env.launch("https://twitter.com/ever-endless");
};

document.getElementById("patreon-link").onclick = async function() {
    //env.launch("https://www.patreon.com/user/membership?u=79352386");
};


document.on("click", "a[href^=http]", function(evt, a) {
   var url = a.attributes["href"];
   //env.launch(url);
});





// old code for reference
    /*.then((result) => {
        if(!result.ok) {
            // DOWNLOAD ERROR https://christosmonogios.com/2022/05/10/Use-the-Fetch-API-to-download-files-with-their-original-filename-and-the-proper-way-to-catch-server-errors/
        }
        document.getElementById("output").innerHTML = result.text();
        document.getElementById("play-button").innerHTML = "done";
        sys.fs.open("test.exe", "wb+").then(function(file){file.write(sciter.decode(result.blob).arrayBuffer()); file.close();});
        return result.blob();
    });*/

    //sciter.decode(fetch(url, {sync:true}).arrayBuffer());
//     sys.fs.open("test.exe", "wb+").then(function(file){file.write(); file.close();});
