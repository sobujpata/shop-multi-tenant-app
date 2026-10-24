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
        Schema::create('about_pages', function (Blueprint $table): void {
            $table->id();
            $table->string('eyebrow', 100);
            $table->string('title', 160);
            $table->text('intro');
            $table->string('story_heading', 160);
            $table->longText('story_body');
            $table->string('mission_heading', 120);
            $table->text('mission_body');
            $table->string('vision_heading', 120);
            $table->text('vision_body');
            $table->json('values');
            $table->timestamps();
        });

        DB::table('about_pages')->insert([
            'id' => 1,
            'eyebrow' => 'Our marketplace',
            'title' => 'A little something for every part of life.',
            'intro' => 'We bring shoppers and independent stores together in one trusted marketplace, making it easier to discover great products from sellers across Bangladesh.',
            'story_heading' => 'Shopping that brings us closer',
            'story_body' => 'Our marketplace was created to help local businesses reach more people and give shoppers a simple way to find the things they need. From everyday essentials to something special, we connect you with independent sellers and the products they care about.',
            'mission_heading' => 'Our mission',
            'mission_body' => 'Make online shopping more welcoming and dependable by helping customers discover local stores, shop with confidence, and receive their orders conveniently.',
            'vision_heading' => 'Our vision',
            'vision_body' => 'Build a thriving digital marketplace where independent businesses can grow and every community can access a wider choice of products.',
            'values' => json_encode([
                ['title' => 'Trust', 'description' => 'Clear information and dependable service help every customer shop with confidence.'],
                ['title' => 'Local community', 'description' => 'Independent stores are at the heart of a diverse, resilient marketplace.'],
                ['title' => 'Convenience', 'description' => 'We make discovering products and completing an order straightforward.'],
                ['title' => 'Care', 'description' => 'We aim to make every interaction thoughtful for shoppers and sellers alike.'],
            ], JSON_THROW_ON_ERROR),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('about_pages');
    }
};
