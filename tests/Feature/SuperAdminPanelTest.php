<?php

use App\Models\AboutPage;
use App\Models\ContactPage;
use App\Models\LegalPage;
use App\Models\MarketSetting;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Activitylog\Models\Activity;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

function createSuperAdminForPanel(): User
{
    app(PermissionRegistrar::class)->forgetCachedPermissions();
    $role = Role::firstOrCreate([
        'name' => 'super-admin',
        'guard_name' => 'web',
    ]);
    Role::firstOrCreate([
        'name' => 'tenant-admin',
        'guard_name' => 'web',
    ]);
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

function createPanelPlan(array $attributes = []): Plan
{
    return Plan::create([
        'name' => 'Panel Plan',
        'price' => 1500,
        'interval' => 'monthly',
        'max_branches' => 2,
        'max_products' => 100,
        'is_active' => true,
        ...$attributes,
    ]);
}

test('super admin area requires authentication and the super-admin role', function () {
    $this->get('/super-admin')->assertRedirect('/staff/login');

    $this->actingAs(User::factory()->create(), 'web')
        ->get('/super-admin')
        ->assertForbidden();

    $this->actingAs(createSuperAdminForPanel(), 'web')
        ->get('/super-admin')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('SuperAdmin/Dashboard')
            ->has('metrics.tenants')
            ->has('recentActivity'));
});

test('super admins can manage marketplace identity and regional settings', function () {
    Storage::fake('public');
    $admin = createSuperAdminForPanel();
    $this->actingAs($admin, 'web')
        ->get(route('super-admin.market-settings.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('SuperAdmin/MarketSettings/Edit')
            ->where('settings.currency_code', 'BDT')
            ->where('settings.timezone', 'UTC')
            ->has('currencies')
            ->has('timezones'));

    $this->put(route('super-admin.market-settings.update'), [
        'market_name' => 'Market One',
        'logo' => UploadedFile::fake()->image('market-logo.png'),
        'remove_logo' => false,
        'currency_code' => 'USD',
        'timezone' => 'America/New_York',
    ])->assertRedirect();

    $settings = MarketSetting::query()->firstOrFail();
    expect($settings->market_name)->toBe('Market One')
        ->and($settings->currency_code)->toBe('USD')
        ->and($settings->timezone)->toBe('America/New_York')
        ->and(Storage::disk('public')->exists($settings->logo_path))->toBeTrue();

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('name', 'Market One')
            ->where('storefrontSettings.currency', 'USD')
            ->where('storefrontSettings.timezone', 'America/New_York'));

    expect(config('app.timezone'))->toBe('America/New_York');
});

test('super admins can manage marketplace social media links', function () {
    $admin = createSuperAdminForPanel();

    $this->actingAs($admin, 'web')
        ->get(route('super-admin.social-media.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('SuperAdmin/SocialMedia/Edit')
            ->has('socialLinks', 0)
            ->has('platforms.instagram'));

    $links = [
        ['platform' => 'instagram', 'url' => 'https://instagram.com/market'],
        ['platform' => 'youtube', 'url' => 'https://youtube.com/@market'],
    ];

    $this->put(route('super-admin.social-media.update'), [
        'social_links' => $links,
    ])->assertRedirect();

    expect(MarketSetting::current()->social_links)->toBe($links);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('storefrontSettings.socialLinks', $links));

    $this->put(route('super-admin.social-media.update'), [
        'social_links' => [
            ['platform' => 'instagram', 'url' => 'javascript:alert(1)'],
            ['platform' => 'instagram', 'url' => 'https://instagram.com/duplicate'],
        ],
    ])->assertSessionHasErrors([
        'social_links.0.url',
        'social_links.1.platform',
    ]);
});

test('super admins can manage storefront footer content', function () {
    $admin = createSuperAdminForPanel();

    $this->actingAs($admin, 'web')
        ->get(route('super-admin.footer-content.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('SuperAdmin/FooterContent/Edit')
            ->where('footerContent.explore_links.0.label', 'Shop all')
            ->where('footerContent.about_heading', 'About')
            ->where('footerContent.about_links.0.url', '/about'));

    $footerContent = [
        'description' => 'Shop local, shop better.',
        'explore_links' => [
            ['label' => 'Our stores', 'url' => '/stores'],
            ['label' => 'External help', 'url' => 'https://example.com/help'],
        ],
        'about_heading' => 'About marketplace',
        'about_links' => [
            ['label' => 'Our story', 'url' => '/about'],
            ['label' => 'Contact team', 'url' => '/contact'],
        ],
        'cta_title' => 'Ready to shop?',
        'cta_description' => 'Discover products from local sellers.',
        'cta_label' => 'Browse products',
        'cta_url' => '/shop',
        'tagline' => 'Made for our community.',
    ];

    $this->put(route('super-admin.footer-content.update'), $footerContent)
        ->assertRedirect();

    expect(MarketSetting::current()->footer_content)
        ->toMatchArray($footerContent);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where(
                'storefrontSettings.footerContent.description',
                'Shop local, shop better.',
            )
            ->where(
                'storefrontSettings.footerContent.explore_links.1.url',
                'https://example.com/help',
            )
            ->where(
                'storefrontSettings.footerContent.about_heading',
                'About marketplace',
            )
            ->where(
                'storefrontSettings.footerContent.about_links.1.label',
                'Contact team',
            )
            ->where(
                'storefrontSettings.footerContent.cta_title',
                'Ready to shop?',
            ));

    $this->put(route('super-admin.footer-content.update'), [
        ...$footerContent,
        'explore_links' => [
            ['label' => 'Unsafe link', 'url' => 'javascript:alert(1)'],
        ],
        'about_links' => [
            ['label' => 'Unsafe link', 'url' => 'javascript:alert(1)'],
        ],
    ])->assertSessionHasErrors([
        'explore_links.0.url',
        'about_links.0.url',
    ]);
});

test('super admins can manage the public about page', function () {
    $admin = createSuperAdminForPanel();

    $this->actingAs($admin, 'web')
        ->get(route('super-admin.about.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('SuperAdmin/About/Edit')
            ->where('about.title', 'A little something for every part of life.')
            ->has('about.values', 4));

    $about = [
        'eyebrow' => 'Who we are',
        'title' => 'A marketplace for everyone.',
        'intro' => 'Discover independent sellers and their products.',
        'story_heading' => 'Our beginnings',
        'story_body' => 'We help local businesses grow.',
        'mission_heading' => 'Our mission',
        'mission_body' => 'Make shopping simple and dependable.',
        'vision_heading' => 'Our vision',
        'vision_body' => 'Help every community thrive.',
        'values' => [
            [
                'title' => 'Community',
                'description' => 'We support local businesses.',
            ],
        ],
    ];

    $this->put(route('super-admin.about.update'), $about)
        ->assertRedirect();

    expect(AboutPage::current()->only(array_keys($about)))
        ->toMatchArray($about);

    $this->get(route('about'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('About')
            ->where('about.title', $about['title'])
            ->where('about.values.0.title', 'Community'));

    $this->put(route('super-admin.about.update'), [
        ...$about,
        'values' => [
            ['title' => '', 'description' => ''],
        ],
    ])->assertSessionHasErrors([
        'values.0.title',
        'values.0.description',
    ]);
});

test('super admins can manage public contact information', function () {
    $admin = createSuperAdminForPanel();

    $this->actingAs($admin, 'web')
        ->get(route('super-admin.contact.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('SuperAdmin/Contact/Edit')
            ->where('contact.title', 'Get in touch')
            ->where('contact.email', 'hello@example.com'));

    $contact = [
        'eyebrow' => 'Talk to our team',
        'title' => 'We would love to hear from you.',
        'intro' => 'Our team is happy to help with your questions.',
        'email' => 'support@market.example',
        'phone' => '+880 2 5555 0100',
        'whatsapp' => '+8801700000000',
        'address' => 'Dhaka, Bangladesh',
        'business_hours' => "Saturday–Thursday\n9:00 AM–6:00 PM",
        'map_url' => 'https://maps.google.com/?q=Dhaka',
    ];

    $this->put(route('super-admin.contact.update'), $contact)
        ->assertRedirect();

    expect(ContactPage::current()->only(array_keys($contact)))
        ->toMatchArray($contact);

    $this->get(route('contact'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Contact')
            ->where('contact.title', $contact['title'])
            ->where('contact.whatsapp', $contact['whatsapp'])
            ->where('contact.map_url', $contact['map_url']));

    $this->put(route('super-admin.contact.update'), [
        ...$contact,
        'email' => 'not-an-email',
        'map_url' => 'javascript:alert(1)',
    ])->assertSessionHasErrors([
        'email',
        'map_url',
    ]);
});

test('super admins can manage all public legal policy pages', function () {
    $admin = createSuperAdminForPanel();
    $this->actingAs($admin, 'web')
        ->get(route('super-admin.legal-pages.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('SuperAdmin/LegalPages/Edit')
            ->where('pages.terms-of-use.title', 'Terms of Use')
            ->where('pages.privacy-policy.title', 'Privacy Policy')
            ->where('pages.refund-policy.title', 'Refund Policy'));

    $pages = [
        'terms-of-use' => [
            'title' => 'Marketplace Terms',
            'intro' => 'Updated terms for marketplace visitors.',
            'content' => "Using the service\nUpdated content for terms.",
        ],
        'privacy-policy' => [
            'title' => 'Your Privacy',
            'intro' => 'Updated privacy information.',
            'content' => "Information we use\nUpdated privacy content.",
        ],
        'refund-policy' => [
            'title' => 'Returns and Refunds',
            'intro' => 'Updated refund information.',
            'content' => "Requesting a refund\nUpdated refund content.",
        ],
    ];

    $this->put(route('super-admin.legal-pages.update'), ['pages' => $pages])
        ->assertRedirect();

    foreach ($pages as $slug => $content) {
        expect(LegalPage::query()->where('slug', $slug)->firstOrFail()->only(array_keys($content)))
            ->toMatchArray($content);

        $route = match ($slug) {
            'terms-of-use' => route('legal.terms'),
            'privacy-policy' => route('legal.privacy'),
            default => route('legal.refund'),
        };

        $this->get($route)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Legal/Show')
                ->where('legalPage.slug', $slug)
                ->where('legalPage.title', $content['title'])
                ->where('legalPage.content', $content['content']));
    }

    $this->put(route('super-admin.legal-pages.update'), [
        'pages' => [
            ...$pages,
            'unexpected-page' => ['title' => 'Unexpected'],
        ],
    ])->assertSessionHasErrors('pages');
});

test('super admins land on the starter dashboard after login', function () {
    $admin = createSuperAdminForPanel();

    $this->actingAs($admin, 'web')
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('auth.roles', ['super-admin'])
            ->has('metrics.tenants')
            ->has('metrics.activeSubscriptions')
            ->has('metrics.todaysOrders')
            ->has('metrics.revenue')
            ->has('recentActivity'));
});

test('super admins can manage users roles and direct permissions across tenants', function () {
    $admin = createSuperAdminForPanel();
    $tenant = Tenant::create([
        'name' => 'Managed Tenant',
        'slug' => 'managed-tenant',
        'email' => 'managed-tenant@example.com',
    ]);
    $branch = $tenant->branches()->create([
        'name' => 'Managed Branch',
        'address' => '1 Main Street',
        'city' => 'Dhaka',
        'phone' => '+8801700000000',
        'is_active' => true,
    ]);
    Role::firstOrCreate(['name' => 'branch-manager', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'products.manage', 'guard_name' => 'web']);
    $tenantUser = User::factory()->create(['tenant_id' => $tenant->id]);
    $tenantUser->assignRole('tenant-admin');
    $platformUser = User::factory()->create();
    $platformUser->assignRole('super-admin');

    $this->actingAs($admin, 'web')
        ->get(route('super-admin.users.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Tenant/Users/Index')
            ->where('isSuperAdmin', true)
            ->has('users.data', 3)
            ->has('roles')
            ->has('permissions'));

    $this->post(route('super-admin.users.store'), [
        'name' => 'Managed Branch User',
        'email' => 'managed-branch-user@example.com',
        'password' => 'BranchPass123!',
        'password_confirmation' => 'BranchPass123!',
        'role' => 'branch-manager',
        'tenant_id' => $tenant->id,
        'branch_id' => $branch->id,
        'permissions' => ['products.manage'],
    ])->assertRedirect();

    $created = User::where('email', 'managed-branch-user@example.com')->firstOrFail();
    expect($created->tenant_id)->toBe($tenant->id)
        ->and($created->branch_id)->toBe($branch->id)
        ->and($created->hasRole('branch-manager'))->toBeTrue()
        ->and($created->hasDirectPermission('products.manage'))->toBeTrue();

    $this->put(route('super-admin.users.update', $tenantUser), [
        'name' => 'Updated Tenant User',
        'email' => $tenantUser->email,
        'phone' => '',
        'role' => 'tenant-admin',
        'permissions' => [],
        'password' => '',
        'password_confirmation' => '',
    ])->assertSessionHasErrors('tenant_id');

    $this->put(route('super-admin.users.update', $tenantUser), [
        'name' => 'Updated Tenant User',
        'email' => $tenantUser->email,
        'phone' => '',
        'role' => 'branch-manager',
        'tenant_id' => $tenant->id,
        'branch_id' => $branch->id,
        'permissions' => ['products.manage'],
        'password' => '',
        'password_confirmation' => '',
    ])->assertRedirect();

    expect($tenantUser->fresh()->hasRole('branch-manager'))->toBeTrue()
        ->and($tenantUser->fresh()->hasDirectPermission('products.manage'))->toBeTrue()
        ->and($tenantUser->fresh()->tenant_id)->toBe($tenant->id);
});

test('only super admins can manage roles and permissions', function () {
    $this->get('/super-admin/roles')->assertRedirect('/staff/login');
    $this->get('/super-admin/permissions')->assertRedirect('/staff/login');

    $this->actingAs(User::factory()->create(), 'web')
        ->get('/super-admin/roles')
        ->assertForbidden();

    $this->actingAs(User::factory()->create(), 'web')
        ->get('/super-admin/permissions')
        ->assertForbidden();
});

test('super admins can manage roles and permissions and assign permissions to roles', function () {
    $admin = createSuperAdminForPanel();
    $existingPermission = Permission::create([
        'name' => 'reports.view',
        'guard_name' => 'web',
    ]);

    $this->actingAs($admin, 'web')
        ->get(route('super-admin.roles.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('SuperAdmin/Roles/Index')
            ->has('roles')
            ->where('permissions', ['reports.view']));

    $this->post(route('super-admin.permissions.store'), [
        'name' => 'reports.export',
    ])->assertRedirect();

    $role = Role::create(['name' => 'report-manager', 'guard_name' => 'web']);
    $this->put(route('super-admin.roles.update', $role), [
        'name' => 'report-admin',
        'permissions' => ['reports.view', 'reports.export'],
    ])->assertRedirect();

    $role = Role::findByName('report-admin', 'web');
    expect($role->hasPermissionTo('reports.view'))->toBeTrue()
        ->and($role->hasPermissionTo('reports.export'))->toBeTrue();

    $this->put(route('super-admin.permissions.update', $existingPermission), [
        'name' => 'reports.read',
    ])->assertRedirect();

    $role->refresh();
    expect($role->hasPermissionTo('reports.read'))->toBeTrue()
        ->and($role->permissions->pluck('name')->all())
        ->toBe(['reports.read', 'reports.export']);

    $this->get(route('super-admin.permissions.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('SuperAdmin/Permissions/Index')
            ->where('permissions.0.name', 'reports.export')
            ->where('permissions.1.name', 'reports.read')
            ->where('permissions.1.roles_count', 1));

    $this->delete(route('super-admin.permissions.destroy', $existingPermission->fresh()))
        ->assertRedirect();

    expect($role->fresh()->permissions->pluck('name')->all())->toBe(['reports.export']);
});

test('system roles cannot be renamed or deleted and assigned custom roles cannot be deleted', function () {
    $admin = createSuperAdminForPanel();
    $systemRole = Role::findByName('super-admin', 'web');
    $customRole = Role::create(['name' => 'support-agent', 'guard_name' => 'web']);
    $staff = User::factory()->create();
    $staff->assignRole($customRole);

    $this->actingAs($admin, 'web')
        ->put(route('super-admin.roles.update', $systemRole), [
            'name' => 'renamed-super-admin',
            'permissions' => [],
        ])
        ->assertRedirect();

    expect(Role::findByName('super-admin', 'web')->name)->toBe('super-admin');

    $this->delete(route('super-admin.roles.destroy', $systemRole))
        ->assertForbidden();
    $this->delete(route('super-admin.roles.destroy', $customRole))
        ->assertSessionHasErrors('role');

    expect(Role::findByName('support-agent', 'web')->users()->whereKey($staff->id)->exists())
        ->toBeTrue();
});

test('tenant creation creates tenant admin in the same operation and logs management actions', function () {
    $admin = createSuperAdminForPanel();

    $this->actingAs($admin, 'web')
        ->post(route('super-admin.tenants.store'), [
            'name' => 'Panel Tenant',
            'slug' => 'panel-tenant',
            'email' => 'panel-tenant@example.com',
            'phone' => '+8801700000000',
            'admin_name' => 'Tenant Admin',
            'admin_email' => 'panel-tenant-admin@example.com',
            'admin_password' => 'TenantPass123!',
            'admin_password_confirmation' => 'TenantPass123!',
        ])
        ->assertRedirect(route('super-admin.tenants.index'));

    $tenant = Tenant::where('slug', 'panel-tenant')->firstOrFail();
    $tenantAdmin = User::where('email', 'panel-tenant-admin@example.com')->firstOrFail();

    expect($tenantAdmin->tenant_id)->toBe($tenant->id)
        ->and(Hash::check('TenantPass123!', $tenantAdmin->password))->toBeTrue()
        ->and($tenantAdmin->hasRole('tenant-admin'))->toBeTrue();

    $this->actingAs($admin, 'web')
        ->patch(route('super-admin.tenants.status', $tenant), ['status' => 'active'])
        ->assertRedirect();

    $this->put(route('super-admin.tenants.update', $tenant), [
        'name' => 'Updated Panel Tenant',
        'slug' => 'updated-panel-tenant',
        'email' => 'updated-panel-tenant@example.com',
        'phone' => null,
    ])->assertRedirect();

    expect($tenant->fresh()->status)->toBe('active')
        ->and($tenant->fresh()->name)->toBe('Updated Panel Tenant')
        ->and(Activity::where('subject_type', Tenant::class)
            ->where('subject_id', $tenant->id)
            ->where('event', 'created')
            ->exists())->toBeTrue();

    $this->delete(route('super-admin.tenants.destroy', $tenant))
        ->assertRedirect();

    expect(Tenant::find($tenant->id))->toBeNull()
        ->and(User::where('email', 'panel-tenant-admin@example.com')->exists())->toBeFalse();
});

test('plans can be managed but cannot be deleted while subscriptions reference them', function () {
    $admin = createSuperAdminForPanel();
    $this->actingAs($admin, 'web');

    $this->post(route('super-admin.plans.store'), [
        'name' => 'Managed Plan',
        'price' => '990.00',
        'interval' => 'yearly',
        'max_branches' => 4,
        'max_products' => 500,
        'is_active' => '1',
    ])->assertRedirect();

    $plan = Plan::where('name', 'Managed Plan')->firstOrFail();
    $this->put(route('super-admin.plans.update', $plan), [
        'name' => 'Updated Managed Plan',
        'price' => '1200',
        'interval' => 'monthly',
        'max_branches' => 5,
        'max_products' => 600,
        'is_active' => false,
    ])->assertRedirect();

    $tenant = Tenant::create([
        'name' => 'Subscription Tenant',
        'slug' => 'subscription-tenant',
        'email' => 'subscription-tenant@example.com',
        'status' => 'active',
    ]);
    $tenant->subscriptions()->create([
        'plan_id' => $plan->id,
        'starts_at' => today(),
        'ends_at' => today()->addMonth(),
        'status' => 'active',
    ]);

    $this->delete(route('super-admin.plans.destroy', $plan))
        ->assertSessionHasErrors('plan');
    expect($plan->fresh())->not->toBeNull();
});

test('super admin can assign renew and cancel subscriptions', function () {
    $admin = createSuperAdminForPanel();
    $tenant = Tenant::create([
        'name' => 'Billing Tenant',
        'slug' => 'billing-tenant',
        'email' => 'billing-tenant@example.com',
    ]);
    $plan = createPanelPlan();

    $this->actingAs($admin, 'web')
        ->post(route('super-admin.subscriptions.store'), [
            'tenant_id' => $tenant->id,
            'plan_id' => $plan->id,
            'starts_at' => today()->toDateString(),
            'ends_at' => today()->addMonth()->toDateString(),
        ])
        ->assertRedirect();

    $subscription = Subscription::where('tenant_id', $tenant->id)->firstOrFail();
    expect($subscription->status)->toBe('active')
        ->and($tenant->fresh()->status)->toBe('active');

    $originalEnd = $subscription->ends_at->toDateString();
    $this->post(route('super-admin.subscriptions.renew', $subscription))
        ->assertRedirect();
    expect($subscription->fresh()->ends_at->toDateString())->toBeGreaterThan($originalEnd);

    $this->post(route('super-admin.subscriptions.cancel', $subscription))
        ->assertRedirect();
    expect($subscription->fresh()->status)->toBe('cancelled')
        ->and($tenant->fresh()->status)->toBe('suspended');
});

test('subscription expiry leaves tenants active in read-only mode without another current subscription', function () {
    $tenant = Tenant::create([
        'name' => 'Expiring Tenant',
        'slug' => 'expiring-tenant',
        'email' => 'expiring-tenant@example.com',
        'status' => 'active',
    ]);
    $plan = createPanelPlan();
    $tenant->subscriptions()->create([
        'plan_id' => $plan->id,
        'starts_at' => today()->subYear(),
        'ends_at' => today()->subDay(),
        'status' => 'active',
    ]);

    $keptTenant = Tenant::create([
        'name' => 'Current Plan Tenant',
        'slug' => 'current-plan-tenant',
        'email' => 'current-plan-tenant@example.com',
        'status' => 'active',
    ]);
    $keptTenant->subscriptions()->create([
        'plan_id' => $plan->id,
        'starts_at' => today()->subMonth(),
        'ends_at' => today()->addMonth(),
        'status' => 'active',
    ]);
    $keptTenant->subscriptions()->create([
        'plan_id' => $plan->id,
        'starts_at' => today()->subYear(),
        'ends_at' => today()->subDay(),
        'status' => 'active',
    ]);

    $this->artisan('subscriptions:expire')->assertSuccessful();

    expect($tenant->fresh()->status)->toBe('active')
        ->and($tenant->subscriptions()->first()->status)->toBe('expired')
        ->and($keptTenant->fresh()->status)->toBe('active')
        ->and($keptTenant->subscriptions()->where('status', 'expired')->count())->toBe(1)
        ->and(Activity::where('subject_type', Tenant::class)
            ->where('subject_id', $tenant->id)
            ->where('description', 'Suspended tenant after subscription expiry')
            ->exists())->toBeFalse();
});

test('activity log filters by user subject and date and opens a detail record', function () {
    $admin = createSuperAdminForPanel();
    $this->actingAs($admin, 'web');

    $tenant = Tenant::create([
        'name' => 'Filtered Activity Tenant',
        'slug' => 'filtered-activity-tenant',
        'email' => 'filtered-activity@example.com',
    ]);
    $activity = Activity::query()
        ->where('subject_type', Tenant::class)
        ->where('subject_id', $tenant->id)
        ->where('event', 'created')
        ->firstOrFail();

    $this->get(route('super-admin.activity-logs.index', [
        'user_id' => $admin->id,
        'subject_type' => Tenant::class,
        'from' => today()->toDateString(),
        'to' => today()->toDateString(),
        'detail' => $activity->id,
    ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('SuperAdmin/ActivityLogs/Index')
            ->where('activities.data.0.id', $activity->id)
            ->where('selectedActivity.id', $activity->id));
});
