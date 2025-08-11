<?php
// Test script to check the actual response from /orders/today endpoint

$url = 'http://localhost/laundry/jawda-laundry-backend/public/api/orders/today?date=2025-08-11';

echo "Testing URL: $url\n\n";

// Make the request
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_NOBODY, false);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n\n";

// Split headers and body
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$headers = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

echo "Headers:\n$headers\n";
echo "Body:\n$body\n";

// Try to decode JSON
$jsonData = json_decode($body, true);
if ($jsonData === null) {
    echo "\nJSON decode error: " . json_last_error_msg() . "\n";
} else {
    echo "\nDecoded JSON structure:\n";
    print_r($jsonData);
    
    if (isset($jsonData['data'])) {
        echo "\nResponse is wrapped in 'data' property\n";
        echo "Data is array: " . (is_array($jsonData['data']) ? 'YES' : 'NO') . "\n";
        echo "Data length: " . (is_array($jsonData['data']) ? count($jsonData['data']) : 'N/A') . "\n";
    } else {
        echo "\nResponse is NOT wrapped in 'data' property\n";
        echo "Response is array: " . (is_array($jsonData) ? 'YES' : 'NO') . "\n";
        echo "Response length: " . (is_array($jsonData) ? count($jsonData) : 'N/A') . "\n";
    }
}
?>
