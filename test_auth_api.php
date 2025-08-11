<?php
// Test authentication and API access
$baseUrl = 'http://localhost/laundry/jawda-laundry-backend/public/api';

// Step 1: Login to get a token
echo "=== Step 1: Login ===\n";
$loginData = [
    'username' => 'admin',
    'password' => '12345678'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/login');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($loginData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Content-Type: application/json'
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Login HTTP Code: $httpCode\n";
echo "Login Response: " . substr($response, 0, 500) . "...\n\n";

// Parse the response to get the token
$loginResult = json_decode($response, true);
if (!$loginResult || !isset($loginResult['token'])) {
    echo "Failed to get token from login response\n";
    echo "Available fields: " . implode(', ', array_keys($loginResult)) . "\n";
    exit(1);
}

$token = $loginResult['token'];
echo "Token: " . substr($token, 0, 50) . "...\n\n";

// Step 2: Test navigation endpoint with token
echo "=== Step 2: Test Navigation Endpoint ===\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/navigation');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Content-Type: application/json',
    'Authorization: Bearer ' . $token
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Navigation HTTP Code: $httpCode\n";
echo "Navigation Response: " . substr($response, 0, 500) . "...\n\n";

// Step 3: Test update navigation item
echo "=== Step 3: Test Update Navigation Item ===\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/navigation/1');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['is_active' => false]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Content-Type: application/json',
    'Authorization: Bearer ' . $token
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Update HTTP Code: $httpCode\n";
echo "Update Response: " . substr($response, 0, 500) . "...\n\n";
?>
