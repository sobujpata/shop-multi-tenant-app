<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_addresses', function (Blueprint $table): void {
            $table->renameColumn('city', 'division');
        });

        Schema::table('customer_addresses', function (Blueprint $table): void {
            $table->string('upazila', 100)->nullable()->after('district');
        });
    }

    public function down(): void
    {
        Schema::table('customer_addresses', function (Blueprint $table): void {
            $table->dropColumn('upazila');
            $table->renameColumn('division', 'city');
        });
    }
};
