<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branch_delivery_costs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->string('area', 100);
            $table->decimal('cost', 10, 2);
            $table->timestamps();
            $table->unique(['branch_id', 'area']);
        });

        DB::table('branches')
            ->select([
                'id',
                'outside_dhaka_delivery_cost',
                'inside_dhaka_delivery_cost',
                'sub_inside_dhaka_delivery_cost',
            ])
            ->orderBy('id')
            ->chunkById(500, function ($branches): void {
                $now = now();
                $costs = [];

                foreach ($branches as $branch) {
                    foreach ([
                        'Outside Dhaka' => $branch->outside_dhaka_delivery_cost,
                        'Inside Dhaka' => $branch->inside_dhaka_delivery_cost,
                        'Subinside Dhaka' => $branch->sub_inside_dhaka_delivery_cost,
                    ] as $area => $cost) {
                        $costs[] = [
                            'branch_id' => $branch->id,
                            'area' => $area,
                            'cost' => $cost,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }
                }

                DB::table('branch_delivery_costs')->insert($costs);
            });

        Schema::table('branches', function (Blueprint $table): void {
            $table->dropColumn([
                'outside_dhaka_delivery_cost',
                'inside_dhaka_delivery_cost',
                'sub_inside_dhaka_delivery_cost',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table): void {
            $table->decimal('outside_dhaka_delivery_cost', 10, 2)->default(0);
            $table->decimal('inside_dhaka_delivery_cost', 10, 2)->default(0);
            $table->decimal('sub_inside_dhaka_delivery_cost', 10, 2)->default(0);
        });

        foreach ([
            'Outside Dhaka' => 'outside_dhaka_delivery_cost',
            'Inside Dhaka' => 'inside_dhaka_delivery_cost',
            'Subinside Dhaka' => 'sub_inside_dhaka_delivery_cost',
        ] as $area => $column) {
            DB::table('branches')->orderBy('id')->chunkById(500, function ($branches) use ($area, $column): void {
                foreach ($branches as $branch) {
                    $cost = DB::table('branch_delivery_costs')
                        ->where('branch_id', $branch->id)
                        ->where('area', $area)
                        ->value('cost');

                    if ($cost !== null) {
                        DB::table('branches')
                            ->where('id', $branch->id)
                            ->update([$column => $cost]);
                    }
                }
            });
        }

        Schema::dropIfExists('branch_delivery_costs');
    }
};
