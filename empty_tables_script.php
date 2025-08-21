<?php

// Database configuration
$host = 'localhost';
$dbname = 'jawda_laundry';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Connected to database successfully.\n";
    
    // Disable foreign key checks
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
    
    // Empty service_offerings table first
    echo "Emptying service_offerings table...\n";
    $pdo->exec('TRUNCATE TABLE service_offerings');
    echo "✓ service_offerings table emptied successfully\n";
    
    // Empty service_actions table
    echo "Emptying service_actions table...\n";
    $pdo->exec('TRUNCATE TABLE service_actions');
    echo "✓ service_actions table emptied successfully\n";
    
    // Re-enable foreign key checks
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
    
    echo "✅ All service tables have been emptied successfully!\n";
    
} catch(PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    
    // Try to re-enable foreign key checks
    try {
        $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
    } catch(Exception $e2) {
        echo "Warning: Could not re-enable foreign key checks\n";
    }
}
