<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ExpireSubscriptions extends Command
{
    protected $signature = 'subscriptions:expire';

    protected $description = 'Expire ended subscriptions and leave their tenant panels read-only.';

    public function handle(): int
    {
        $expiredCount = DB::transaction(function (): int {
            $subscriptions = Subscription::query()
                ->where('status', 'active')
                ->whereDate('ends_at', '<', today())
                ->lockForUpdate()
                ->get();

            foreach ($subscriptions as $subscription) {
                $subscription->update(['status' => 'expired']);
            }

            return $subscriptions->count();
        });

        $this->info("Expired {$expiredCount} subscription(s).");

        return self::SUCCESS;
    }
}
