<?php

// generate a random filename. No conflict checking (!)
$filename = "image" . mt_rand() . ".png";

//$fh = fopen("../generated/$filename", "w") or die("can't open file");
$dataurl = str_replace(" ", "+", $_POST["data"]);
$data = substr($dataurl, strpos($dataurl, ","));

$file = fopen("../generated/$filename", "w");
fwrite($file, base64_decode($data));
fclose($file);

echo "{ \"filename\": \"$filename\" }";
