<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table): void {
            $table->decimal('outside_dhaka_delivery_cost', 10, 2)->default(0);
            $table->decimal('inside_dhaka_delivery_cost', 10, 2)->default(0);
            $table->decimal('sub_inside_dhaka_delivery_cost', 10, 2)->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table): void {
            $table->dropColumn([
                'outside_dhaka_delivery_cost',
                'inside_dhaka_delivery_cost',
                'sub_inside_dhaka_delivery_cost',
            ]);
        });
    }
};
