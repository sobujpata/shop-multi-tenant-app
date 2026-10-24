<?php

use Illuminate\Contracts\Encryption\Encrypter;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Support\Facades\Schema;

test('customer login and registration routes are rate limited', function () {
    foreach ([
        ['customer.register.store', '192.0.2.82', []],
        ['customer.login.store', '192.0.2.83', [
            'email' => 'not-a-customer@example.com',
            'password' => 'invalid-password',
        ]],
    ] as [$route, $ip, $payload]) {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->withServerVariables(['REMOTE_ADDR' => $ip])
                ->post(route($route), $payload)
                ->assertRedirect();
        }

        $this->withServerVariables(['REMOTE_ADDR' => $ip])
            ->post(route($route), $payload)
            ->assertTooManyRequests();
    }
});

test('web csrf middleware rejects requests without a matching session token', function () {
    $session = app('session')->driver();
    $session->start();
    $request = Request::create('/customer/register', 'POST');
    $request->setLaravelSession($session);

    $middleware = new class(app(), app(Encrypter::class)) extends ValidateCsrfToken
    {
        protected function runningUnitTests(): bool
        {
            return false;
        }
    };

    expect(fn () => $middleware->handle($request, fn () => response('ok')))
        ->toThrow(TokenMismatchException::class);

    $request->merge(['_token' => $session->token()]);
    expect($middleware->handle($request, fn () => response('ok'))->getContent())->toBe('ok');
});

test('lazy loading is prevented outside production', function () {
    expect(Model::preventsLazyLoading())->toBeTrue();
});

test('catalog and approved review filters have supporting database indexes', function () {
    $productIndexes = collect(Schema::getIndexes('products'))->pluck('columns');
    $variantIndexes = collect(Schema::getIndexes('product_variants'))->pluck('columns');
    $reviewIndexes = collect(Schema::getIndexes('reviews'))->pluck('columns');

    expect($productIndexes)
        ->toContain(['is_active', 'category_id'])
        ->toContain(['is_active', 'brand_id'])
        ->toContain(['is_active', 'gender', 'base_price'])
        ->and($variantIndexes)->toContain(['product_id', 'color', 'size'])
        ->and($reviewIndexes)->toContain(['product_id', 'is_approved', 'created_at']);
});
