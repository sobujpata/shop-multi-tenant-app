<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('market_settings', function (Blueprint $table): void {
            $table->id();
            $table->string('market_name')->default('Marketplace');
            $table->string('logo_path')->nullable();
            $table->string('currency_code', 3)->default('BDT');
            $table->string('timezone')->default('Asia/Dhaka');
            $table->timestamps();
        });

        DB::table('market_settings')->insert([
            'id' => 1,
            'market_name' => config('app.name', 'Marketplace'),
            'currency_code' => 'BDT',
            'timezone' => config('app.timezone', 'Asia/Dhaka'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('market_settings');
    }
};
