<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop navigation-related tables in the correct order (respecting foreign key constraints)
        
        // Drop user_navigation_permissions table first (it references navigation_items)
        Schema::dropIfExists('user_navigation_permissions');
        
        // Drop user_main_navs table
        Schema::dropIfExists('user_main_navs');
        
        // Drop nav_items table
        Schema::dropIfExists('nav_items');
        
        // Drop main_navs table
        Schema::dropIfExists('main_navs');
        
        // Drop navigation_items table last (it has self-referencing foreign key)
        Schema::dropIfExists('navigation_items');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Note: This migration is destructive and cannot be reversed
        // The original table structures would need to be recreated manually if needed
    }
};
