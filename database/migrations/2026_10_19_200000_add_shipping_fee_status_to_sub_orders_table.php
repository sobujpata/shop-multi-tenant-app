<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sub_orders', function (Blueprint $table): void {
            $table->enum('shipping_fee_status', ['pending', 'paid'])
                ->default('pending')
                ->after('status');
        });

        DB::table('sub_orders')
            ->whereIn(
                'order_id',
                DB::table('orders')->select('id')->where('payment_status', 'paid'),
            )
            ->update(['shipping_fee_status' => 'paid']);
    }

    public function down(): void
    {
        Schema::table('sub_orders', function (Blueprint $table): void {
            $table->dropColumn('shipping_fee_status');
        });
    }
};
