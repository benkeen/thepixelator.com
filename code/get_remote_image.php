<?php

/**
 * Added in Nov 2012 due to change in the way the ClosePixelate resources worked: it no longer allows
 * remote-loading of images. As such, this backend solution makes a copy of a remote file (PNG, GIF and
 * JPG only) in a local folder, which it can then use in the interface.
 */
if (!isset($_GET["url"])) {
	exit;
}

function url_exists($url) {
    $handle = curl_init($url);
    if (false === $handle) {
        return false;
    }
    curl_setopt($handle, CURLOPT_HEADER, false);
    curl_setopt($handle, CURLOPT_FAILONERROR, true);  // this works
    curl_setopt($handle, CURLOPT_HTTPHEADER, Array("User-Agent: Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.15) Gecko/20080623 Firefox/2.0.0.15") ); // request as if Firefox
    curl_setopt($handle, CURLOPT_NOBODY, true);
    curl_setopt($handle, CURLOPT_RETURNTRANSFER, false);
    $connectable = curl_exec($handle);
    curl_close($handle);
    return $connectable;
}

function get_file_type($url) {
	$parts = explode(".", $url);
	$extension = strtolower($parts[count($parts)-1]);
	return $extension;
}

function curl_file_get_contents($url) {
	$ch = curl_init();
	$timeout = 30;
	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $timeout);
	$data = curl_exec($ch);
	curl_close($ch);

	if ($data) {
		return $data;
	} else {
		echo "?";
	}
}

$url = $_GET["url"];

// first, confirm the URL exists
if (!url_exists($url)) {
	echo "{ \"success\": false, \"message\": \"Sorry, that URL doesn't seem to contain an image!\" }";
	exit;
}

// second, that it's a filetype we can work with
$extension = get_file_type($url);
if (!in_array($extension, array("png", "gif", "jpg"))) {
	echo "{ \"success\": false, \"message\": \"Sorry, please only supply URLs of images in PNG, GIF and JPG format.\" }";
	exit;
}

// okay, now lets make a copy of it locally with a random filename, and return that to the client
$image_data = curl_file_get_contents($url);
$filename = "tmp" . time() . "." . $extension;
$fh = fopen(dirname(__FILE__) . "/../remote/$filename", "w");
fwrite($fh, $image_data);
fclose($fh);

echo "{ \"success\": true, \"message\": \"$filename\" }";
exit;