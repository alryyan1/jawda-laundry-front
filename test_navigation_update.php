<?php
// Test script for navigation update endpoint
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
    exit(1);
}

$token = $loginResult['token'];
echo "Token: " . substr($token, 0, 50) . "...\n\n";

// Step 2: Get current navigation items
echo "=== Step 2: Get Current Navigation Items ===\n";
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
$navigationData = json_decode($response, true);
if ($navigationData && isset($navigationData['data']) && count($navigationData['data']) > 0) {
    $firstItem = $navigationData['data'][0];
    echo "First item ID: " . $firstItem['id'] . "\n";
    echo "First item is_active: " . ($firstItem['is_active'] ? 'true' : 'false') . "\n";
    echo "First item title: " . $firstItem['title']['en'] . "\n\n";
} else {
    echo "No navigation items found\n";
    exit(1);
}

// Step 3: Test update with boolean true
echo "=== Step 3: Test Update with Boolean True ===\n";
$updateData = ['is_active' => true];
echo "Sending data: " . json_encode($updateData) . "\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/navigation/' . $firstItem['id']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($updateData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Content-Type: application/json',
    'Authorization: Bearer ' . $token
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Update with boolean false - HTTP Code: $httpCode\n";
echo "Response: " . substr($response, 0, 300) . "...\n\n";

// Step 4: Verify the change
echo "=== Step 4: Verify the Change ===\n";
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

echo "Verification HTTP Code: $httpCode\n";
$navigationData = json_decode($response, true);
if ($navigationData && isset($navigationData['data']) && count($navigationData['data']) > 0) {
    $firstItem = $navigationData['data'][0];
    echo "First item is_active after update: " . ($firstItem['is_active'] ? 'true' : 'false') . "\n";
} else {
    echo "Failed to get updated navigation items\n";
}
?>
