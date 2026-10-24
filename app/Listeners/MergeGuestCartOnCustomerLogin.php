<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Models\Customer;
use App\Services\CartService;
use Illuminate\Auth\Events\Login;
use Illuminate\Http\Request;

class MergeGuestCartOnCustomerLogin
{
    public function __construct(
        private readonly CartService $cartService,
        private readonly Request $request,
    ) {}

    public function handle(Login $event): void
    {
        if ($event->guard !== 'customer' || ! $event->user instanceof Customer) {
            return;
        }

        $sessionId = $this->request->session()->pull(
            CartService::GUEST_SESSION_KEY,
            $this->request->session()->getId(),
        );

        $this->cartService->mergeGuestCart(
            $event->user,
            is_string($sessionId) ? $sessionId : $this->request->session()->getId(),
        );
    }
}
