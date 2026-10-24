<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_profiles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('customer_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('avatar')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->date('date_of_birth')->nullable();
            $table->text('bio')->nullable();
            $table->string('preferred_language')->default('en');
            $table->boolean('newsletter_opt_in')->default(false);
            $table->timestamps();
        });

        DB::table('customers')
            ->select('id')
            ->orderBy('id')
            ->chunkById(500, function ($customers): void {
                DB::table('customer_profiles')->insert(
                    $customers->map(fn (object $customer): array => [
                        'customer_id' => $customer->id,
                        'preferred_language' => 'en',
                        'newsletter_opt_in' => false,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ])->all(),
                );
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_profiles');
    }
};
