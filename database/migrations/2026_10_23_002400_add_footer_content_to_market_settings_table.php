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
        Schema::table('market_settings', function (Blueprint $table): void {
            $table->json('footer_content')->nullable()->after('social_links');
        });

        DB::table('market_settings')->where('id', 1)->update([
            'footer_content' => json_encode([
                'description' => 'A little something for every part of life. Discover considered finds from independent stores near you.',
                'explore_links' => [
                    ['label' => 'Shop all', 'url' => '/shop'],
                    ['label' => 'New arrivals', 'url' => '/shop?sort=newest'],
                    ['label' => 'My account', 'url' => '/customer/account/profile'],
                ],
                'cta_title' => 'A better way to discover',
                'cta_description' => 'Shop unique collections from neighborhood stores, all in one place.',
                'cta_label' => 'Find your next favorite',
                'cta_url' => '/shop',
                'tagline' => 'Thoughtfully selected, locally delivered.',
            ], JSON_THROW_ON_ERROR),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::table('market_settings', function (Blueprint $table): void {
            $table->dropColumn('footer_content');
        });
    }
};
