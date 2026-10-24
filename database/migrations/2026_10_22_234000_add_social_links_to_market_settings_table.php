<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('market_settings', function (Blueprint $table): void {
            $table->json('social_links')->nullable()->after('timezone');
        });
    }

    public function down(): void
    {
        Schema::table('market_settings', function (Blueprint $table): void {
            $table->dropColumn('social_links');
        });
    }
};
