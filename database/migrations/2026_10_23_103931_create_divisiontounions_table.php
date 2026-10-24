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
        Schema::create('divisiontounions', function (Blueprint $table) {
            $table->id();
            $table->string('divisions', 255);
            $table->string('districts', 255);
            $table->string('upazilas', 255);
            $table->string('unions', 255);
            $table->string('postoffices', 255);
            $table->string('postcodes', 255);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('divisiontounions');
    }
};
