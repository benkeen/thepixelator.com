<?php

$filename = $_GET["filename"];
$file = "http://thepixelator.com/generated/$filename";

header("Pragma: public");
header("Expires: 0");
header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
header("Content-Type: application/force-download");
header("Content-Disposition: attachment; filename=" . basename($filename));
header("Content-Description: File Transfer");
@readfile($file);
