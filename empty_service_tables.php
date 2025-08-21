<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Starting to empty service tables...\n";

try {
    // Disable foreign key checks temporarily
    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    // Empty service_offerings table first (due to foreign key constraints)
    echo "Emptying service_offerings table...\n";
    DB::table('service_offerings')->truncate();
    echo "✓ service_offerings table emptied successfully\n";

    // Empty service_actions table
    echo "Emptying service_actions table...\n";
    DB::table('service_actions')->truncate();
    echo "✓ service_actions table emptied successfully\n";

    // Re-enable foreign key checks
    DB::statement('SET FOREIGN_KEY_CHECKS=1;');

    echo "✅ All service tables have been emptied successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Error emptying tables: " . $e->getMessage() . "\n";
    
    // Re-enable foreign key checks in case of error
    DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    
    exit(1);
}

echo "Done!\n";
