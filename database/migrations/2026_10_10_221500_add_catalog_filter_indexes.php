<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->index(['is_active', 'category_id'], 'products_active_category_index');
            $table->index(['is_active', 'brand_id'], 'products_active_brand_index');
            $table->index(['is_active', 'gender', 'base_price'], 'products_active_gender_price_index');
        });

        Schema::table('product_variants', function (Blueprint $table): void {
            $table->index(['product_id', 'color', 'size'], 'product_variants_product_color_size_index');
        });

        Schema::table('reviews', function (Blueprint $table): void {
            $table->index(['product_id', 'is_approved', 'created_at'], 'reviews_product_approved_created_index');
        });
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table): void {
            $table->dropIndex('reviews_product_approved_created_index');
        });

        Schema::table('product_variants', function (Blueprint $table): void {
            $table->dropIndex('product_variants_product_color_size_index');
        });

        Schema::table('products', function (Blueprint $table): void {
            $table->dropIndex('products_active_gender_price_index');
            $table->dropIndex('products_active_brand_index');
            $table->dropIndex('products_active_category_index');
        });
    }
};
