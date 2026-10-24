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
        Schema::create('contact_pages', function (Blueprint $table): void {
            $table->id();
            $table->string('eyebrow', 100);
            $table->string('title', 160);
            $table->text('intro');
            $table->string('email', 255)->nullable();
            $table->string('phone', 40)->nullable();
            $table->string('whatsapp', 40)->nullable();
            $table->text('address')->nullable();
            $table->text('business_hours')->nullable();
            $table->string('map_url', 2048)->nullable();
            $table->timestamps();
        });

        DB::table('contact_pages')->insert([
            'id' => 1,
            'eyebrow' => 'We are here to help',
            'title' => 'Get in touch',
            'intro' => 'Have a question about shopping, selling, or your order? Reach out to our marketplace team.',
            'email' => 'hello@example.com',
            'phone' => null,
            'whatsapp' => null,
            'address' => 'Dhaka, Bangladesh',
            'business_hours' => 'Saturday–Thursday, 9:00 AM–6:00 PM',
            'map_url' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_pages');
    }
};
