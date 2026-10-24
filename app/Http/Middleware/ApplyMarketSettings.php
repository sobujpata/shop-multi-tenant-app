<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\MarketSetting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApplyMarketSettings
{
    public function handle(Request $request, Closure $next): Response
    {
        $timezone = MarketSetting::current()->timezone;
        config(['app.timezone' => $timezone]);
        date_default_timezone_set($timezone);

        return $next($request);
    }
}
