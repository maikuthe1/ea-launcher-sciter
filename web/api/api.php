<?php
function time_cmp($a, $b)
{
	return $a["time"] > $b["time"];
}

function version_cmp($a, $b) {
	return $a["version"] < $b["version"];
}

function scan_dir($dir) {
    $ignored = array('.', '..', '.php', '.html');

    $versions = array();
	$files = array();
	$count = 0;
    foreach (scandir("../".$dir) as $file) {
        if (in_array($file, $ignored)) continue;
        $files[] = array("time" => filemtime($dir . '/' . $file), "name" => $file);
    }
    usort($files, "time_cmp");
	foreach ($files as $file) {
		$info = array("name" => $file["name"], "version" => $count++, "url" => "http://127.0.0.1/" . '/'.$dir . "/". $file["name"], "size" => filesize("../".$dir . "/" . $file["name"]), "time" => filemtime("../".$dir . '/' . $file["name"]));
		$versions[] = $info;
	}
    $files = array_keys($files);

    return $versions;
}

if(@$_GET["request"] == "versions") {
	$files = scan_dir("assets");
	usort($files, "version_cmp");
	echo json_encode($files);
}

if(@$_GET["request"] == "launcher_update") {
	$remote_version = $_GET["version"];
	$files = scan_dir("launchers");
	usort($files, "version_cmp");
	if(explode("_", $files[0]["name"])[1] > $remote_version) {
		echo json_encode($files);
	}
	else {
		echo "false";
	}
}
?>
