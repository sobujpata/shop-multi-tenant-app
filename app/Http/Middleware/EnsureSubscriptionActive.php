<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSubscriptionActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user('web');
        $tenant = $user?->tenant;
        $hasActiveSubscription = $tenant?->activeSubscription()->exists() ?? false;

        abort_unless(
            $tenant !== null
                && $tenant->status === 'active',
            Response::HTTP_FORBIDDEN,
            'This seller account is not active.',
        );

        abort_if(
            ! $hasActiveSubscription && ! $request->isMethodSafe(),
            Response::HTTP_FORBIDDEN,
            'Your subscription has expired. The tenant panel is read-only until it is renewed.',
        );

        return $next($request);
    }
}
