<?php

use App\Models\Customer;
use App\Models\User;
use App\Notifications\CustomerResetPassword;
use App\Notifications\CustomerVerifyEmail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;

test('customer and staff login pages use their separate URLs', function () {
    $this->get('/customer/login')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Customer/Login'));

    $this->get('/customer/register')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Customer/Register'));

    $this->get('/staff/login')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('auth/login'));
});

test('customers can register and receive an email verification notification', function () {
    Notification::fake();

    $response = $this->post(route('customer.register.store'), [
        'name' => 'Shopper Example',
        'email' => 'shopper@example.com',
        'phone' => '+880 1712-345678',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ]);

    $customer = Customer::where('email', 'shopper@example.com')->firstOrFail();

    $response->assertRedirect(route('customer.verification.notice'));
    $this->assertAuthenticatedAs($customer, 'customer');
    $this->assertGuest('web');
    $this->assertDatabaseHas('customer_profiles', [
        'customer_id' => $customer->id,
    ]);
    expect($customer->phone)->toBe('+880 1712-345678')
        ->and(password_verify('Password123!', $customer->password))->toBeTrue();
    Notification::assertSentTo($customer, CustomerVerifyEmail::class);

    $this->get(route('customer.verification.notice'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Customer/VerifyEmail')
        );
});

test('customers can sign in without authenticating as staff', function () {
    $customer = Customer::create([
        'name' => 'Shopper Example',
        'email' => 'shopper@example.com',
        'password' => 'Password123!',
    ]);

    $this->post(route('customer.login.store'), [
        'email' => $customer->email,
        'password' => 'Password123!',
    ])->assertRedirect(route('home', absolute: false));

    $this->assertAuthenticatedAs($customer, 'customer');
    $this->assertGuest('web');
    expect($customer->fresh()->last_login_at)->not->toBeNull();
});

test('blocked customers cannot sign in', function () {
    $customer = Customer::create([
        'name' => 'Blocked Shopper',
        'email' => 'blocked@example.com',
        'password' => 'Password123!',
        'status' => 'blocked',
    ]);

    $this->post(route('customer.login.store'), [
        'email' => $customer->email,
        'password' => 'Password123!',
    ])->assertSessionHasErrors('email');

    $this->assertGuest('customer');
    expect($customer->fresh()->last_login_at)->toBeNull();
});

test('customer sign out does not sign out the staff guard', function () {
    $customer = Customer::create([
        'name' => 'Shopper Example',
        'email' => 'shopper@example.com',
        'password' => 'Password123!',
    ]);
    $staff = User::factory()->create();

    $this->actingAs($customer, 'customer');
    $this->actingAs($staff, 'web');

    $this->post(route('customer.logout'))->assertRedirect(route('home'));

    $this->assertGuest('customer');
    $this->assertAuthenticatedAs($staff, 'web');
});

test('customer password reset uses the customer broker and reset URL', function () {
    Notification::fake();
    $customer = Customer::create([
        'name' => 'Shopper Example',
        'email' => 'shopper@example.com',
        'password' => 'Password123!',
    ]);

    $this->post(route('customer.password.email'), [
        'email' => $customer->email,
    ])->assertSessionHas('status');

    Notification::assertSentTo(
        $customer,
        CustomerResetPassword::class,
        function (CustomerResetPassword $notification) use ($customer): bool {
            $url = $notification->toMail($customer)->actionUrl;

            return str_contains($url, '/customer/reset-password/')
                && str_contains($url, urlencode($customer->email));
        },
    );
});

test('customers can reset passwords using the customer reset-token store', function () {
    $customer = Customer::create([
        'name' => 'Shopper Example',
        'email' => 'shopper@example.com',
        'password' => 'Password123!',
    ]);
    $token = Password::broker('customers')->createToken($customer);

    $this->post(route('customer.password.update'), [
        'token' => $token,
        'email' => $customer->email,
        'password' => 'NewPassword123!',
        'password_confirmation' => 'NewPassword123!',
    ])->assertRedirect(route('customer.login'));

    expect(Hash::check('NewPassword123!', $customer->fresh()->password))->toBeTrue();
});

test('customer email verification requires a valid signed customer URL', function () {
    $customer = Customer::create([
        'name' => 'Shopper Example',
        'email' => 'shopper@example.com',
        'password' => 'Password123!',
    ]);

    $url = URL::temporarySignedRoute(
        'customer.verification.verify',
        now()->addMinutes(60),
        [
            'id' => $customer->id,
            'hash' => sha1($customer->getEmailForVerification()),
        ],
    );

    $this->actingAs($customer, 'customer')
        ->get($url)
        ->assertRedirect(route('home', absolute: false).'?verified=1');

    expect($customer->fresh()->hasVerifiedEmail())->toBeTrue();
});

test('inertia shares the authenticated customer independently of staff', function () {
    $customer = Customer::create([
        'name' => 'Shopper Example',
        'email' => 'shopper@example.com',
        'password' => 'Password123!',
    ]);

    $this->actingAs($customer, 'customer')
        ->get(route('customer.verification.notice'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.customer.email', $customer->email)
            ->where('auth.user', null));
});

test('customer verification email uses a customer-specific signed route', function () {
    $customer = Customer::create([
        'name' => 'Shopper Example',
        'email' => 'shopper@example.com',
        'password' => 'Password123!',
    ]);

    $message = (new CustomerVerifyEmail)->toMail($customer);

    expect($message->actionUrl)
        ->toContain('/customer/email/verify/'.$customer->id.'/');
});

test('guest customer routes redirect shoppers to the customer login page', function () {
    $this->get('/customer/email/verify')
        ->assertRedirect(route('customer.login'));
});
