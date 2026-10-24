<?php

use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\CustomerProfile;
use App\Models\Divisiontounion;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

function createAccountCustomer(array $attributes = []): Customer
{
    return Customer::create([
        'name' => 'Shopper Example',
        'email' => 'shopper@example.com',
        'password' => 'Password123!',
        ...$attributes,
    ]);
}

test('customer creation automatically creates an empty profile', function () {
    $customer = createAccountCustomer();

    expect($customer->profile)->toBeInstanceOf(CustomerProfile::class)
        ->and($customer->profile->preferred_language)->toBe('en')
        ->and($customer->profile->newsletter_opt_in)->toBeFalse();
});

test('customer profile page shows merged profile data', function () {
    $customer = createAccountCustomer();
    $customer->profile->update([
        'gender' => 'other',
        'bio' => 'I enjoy finding independent brands.',
    ]);

    $this->actingAs($customer, 'customer')
        ->get(route('customer.account.profile'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Customer/Account/Profile')
            ->where('profile.name', $customer->name)
            ->where('profile.email', $customer->email)
            ->where('profile.gender', 'other')
            ->where('profile.bio', 'I enjoy finding independent brands.')
            ->where('avatarUrl', null));
});

test('customers can update profile fields and upload an avatar', function () {
    Notification::fake();
    Storage::fake('public');
    $customer = createAccountCustomer();
    $avatar = UploadedFile::fake()->image('avatar.png');

    $this->actingAs($customer, 'customer')
        ->put(route('customer.account.profile.update'), [
            'name' => 'Updated Shopper',
            'email' => 'updated@example.com',
            'phone' => '+880 1712-345678',
            'avatar' => $avatar,
            'gender' => 'female',
            'date_of_birth' => '1995-04-12',
            'bio' => 'Fashion enthusiast',
            'preferred_language' => 'bn',
            'newsletter_opt_in' => '1',
        ])
        ->assertRedirect(route('customer.account.profile'));

    $customer->refresh()->load('profile');

    expect($customer->name)->toBe('Updated Shopper')
        ->and($customer->email)->toBe('updated@example.com')
        ->and($customer->email_verified_at)->toBeNull()
        ->and($customer->phone)->toBe('+880 1712-345678')
        ->and($customer->profile->gender)->toBe('female')
        ->and($customer->profile->preferred_language)->toBe('bn')
        ->and($customer->profile->newsletter_opt_in)->toBeTrue()
        ->and($customer->full_profile['bio'])->toBe('Fashion enthusiast')
        ->and($customer->profile->avatar)->not->toBeNull();

    Storage::disk('public')->assertExists($customer->profile->avatar);
});

test('customers can change their password only after entering the current password', function () {
    $customer = createAccountCustomer();

    $this->actingAs($customer, 'customer')
        ->put(route('customer.account.password.update'), [
            'current_password' => 'incorrect',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])
        ->assertSessionHasErrors('current_password');

    $this->put(route('customer.account.password.update'), [
        'current_password' => 'Password123!',
        'password' => 'NewPassword123!',
        'password_confirmation' => 'NewPassword123!',
    ])->assertRedirect(route('customer.account.profile'));

    expect(Hash::check('NewPassword123!', $customer->fresh()->password))->toBeTrue();
});

test('customers can manage addresses and only one address is default', function () {
    $customer = createAccountCustomer();
    $this->actingAs($customer, 'customer');

    $this->post(route('customer.account.addresses.store'), [
        'label' => 'Home',
        'recipient_name' => 'Shopper Example',
        'phone' => '+880 1712-345678',
        'address_line' => '12 Example Road',
        'division' => 'Dhaka',
        'district' => 'Dhaka',
        'upazila' => 'Dhanmondi',
        'postal_code' => '1207',
        'is_default' => '1',
    ])->assertRedirect(route('customer.account.addresses'));

    $home = $customer->addresses()->firstOrFail();
    expect($home->division)->toBe('Dhaka')
        ->and($home->upazila)->toBe('Dhanmondi');

    $this->post(route('customer.account.addresses.store'), [
        'label' => 'Office',
        'recipient_name' => 'Shopper Example',
        'phone' => '+880 1712-345678',
        'address_line' => '20 Market Street',
        'division' => 'Dhaka',
        'district' => 'Dhaka',
        'upazila' => 'Dhanmondi',
        'postal_code' => '',
        'is_default' => '1',
    ])->assertRedirect(route('customer.account.addresses'));

    $office = $customer->addresses()->where('label', 'Office')->firstOrFail();
    expect($home->fresh()->is_default)->toBeFalse()
        ->and($office->is_default)->toBeTrue();

    $this->put(route('customer.account.addresses.update', $home), [
        'label' => 'Home updated',
        'recipient_name' => 'Shopper Example',
        'phone' => '+880 1712-345678',
        'address_line' => '14 Example Road',
        'division' => 'Dhaka',
        'district' => 'Dhaka',
        'upazila' => 'Dhanmondi',
        'postal_code' => '1207',
        'is_default' => '1',
    ])->assertRedirect(route('customer.account.addresses'));

    expect($office->fresh()->is_default)->toBeFalse()
        ->and($home->fresh()->is_default)->toBeTrue()
        ->and($home->fresh()->address_line)->toBe('14 Example Road');

    $this->delete(route('customer.account.addresses.destroy', $office))
        ->assertRedirect(route('customer.account.addresses'));

    expect(CustomerAddress::find($office->id))->toBeNull();
});

test('customer address page receives cascading division location options', function () {
    $customer = createAccountCustomer();
    Divisiontounion::create([
        'divisions' => 'Dhaka',
        'districts' => 'Dhaka',
        'upazilas' => 'Dhanmondi',
        'unions' => 'Ward 15',
        'postoffices' => 'Dhanmondi',
        'postcodes' => '1209',
    ]);

    $this->actingAs($customer, 'customer')
        ->get(route('customer.account.addresses'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Customer/Account/Addresses')
            ->where('locations.0', [
                'division' => 'Dhaka',
                'district' => 'Dhaka',
                'upazila' => 'Dhanmondi',
            ])
        );
});

test('customers cannot update or delete another customer address', function () {
    $customer = createAccountCustomer();
    $otherCustomer = createAccountCustomer([
        'email' => 'other@example.com',
    ]);
    $address = $otherCustomer->addresses()->create([
        'label' => 'Home',
        'recipient_name' => 'Other Shopper',
        'phone' => '+880 1712-345679',
        'address_line' => '8 Private Road',
        'division' => 'Dhaka',
        'district' => 'Dhaka',
        'upazila' => 'Dhanmondi',
    ]);

    $this->actingAs($customer, 'customer')
        ->delete(route('customer.account.addresses.destroy', $address))
        ->assertNotFound();

    expect($address->fresh())->not->toBeNull();
});
