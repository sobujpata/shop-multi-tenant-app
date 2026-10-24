<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Alphabet without scanner-ambiguous characters (no 0, 1, I, O, L).
     */
    private const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

    public function up(): void
    {
        Schema::table('product_variants', function (Blueprint $table): void {
            $table->string('barcode_code', 5)->nullable()->after('sku');
            $table->unique('barcode_code');
        });

        // Backfill existing variants with unique scanner-friendly codes.
        $rows = [];
        $used = [];

        $backfill = DB::table('product_variants')
            ->whereNull('barcode_code')
            ->orderBy('id')
            ->get(['id']);

        foreach ($backfill as $variant) {
            do {
                $code = substr(str_shuffle(self::ALPHABET), 0, 5);
            } while (in_array($code, $used, true));

            $used[] = $code;
            $rows[] = ['id' => $variant->id, 'barcode_code' => $code];
        }

        foreach (array_chunk($rows, 100) as $chunk) {
            foreach ($chunk as $row) {
                DB::table('product_variants')
                    ->where('id', $row['id'])
                    ->update(['barcode_code' => $row['barcode_code']]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('product_variants', function (Blueprint $table): void {
            $table->dropUnique('product_variants_barcode_code_unique');
            $table->dropColumn('barcode_code');
        });
    }
};
