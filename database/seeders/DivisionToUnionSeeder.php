<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class DivisionToUnionSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('seeders/data/divisiontounion.csv');
        $file = fopen($path, 'r');

        if ($file === false) {
            throw new RuntimeException("Unable to open division-to-union data file: {$path}");
        }

        $now = now()->toDateTimeString();
        $batch = [];

        try {
            $header = fgetcsv($file);

            if ($header !== ['id', 'divisions', 'districts', 'upazilas', 'unions', 'postoffices', 'postcodes']) {
                throw new RuntimeException('Invalid header in division-to-union data file.');
            }

            while (($record = fgetcsv($file)) !== false) {
                if (count($record) !== 7) {
                    throw new RuntimeException('Invalid record in division-to-union data file.');
                }

                $batch[] = [
                    'id' => (int) $record[0],
                    'divisions' => $record[1],
                    'districts' => $record[2],
                    'upazilas' => $record[3],
                    'unions' => $record[4],
                    'postoffices' => $record[5],
                    'postcodes' => $record[6],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                if (count($batch) === 500) {
                    $this->upsertBatch($batch);
                    $batch = [];
                }
            }

            if ($batch !== []) {
                $this->upsertBatch($batch);
            }
        } finally {
            fclose($file);
        }
    }

    /**
     * @param array<int, array<string, int|string>> $records
     */
    private function upsertBatch(array $records): void
    {
        DB::table('divisiontounions')->upsert(
            $records,
            ['id'],
            ['divisions', 'districts', 'upazilas', 'unions', 'postoffices', 'postcodes', 'updated_at'],
        );
    }
}
