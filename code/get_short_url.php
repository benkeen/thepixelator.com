<?php

$google_url_shortener_key = "***enter code here***";
$url = array("longUrl" => $_POST["url"]);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://www.googleapis.com/urlshortener/v1/url?key=$google_url_shortener_key");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-type: application/json'));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($url));
$output = curl_exec($ch);
curl_close($ch);

echo $output;