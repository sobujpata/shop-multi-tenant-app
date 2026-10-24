<?php

use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Plan;
use App\Models\Product;
use App\Models\ProductAttribute;
use App\Models\ProductVariant;
use App\Models\SubOrder;
use App\Models\Tenant;
use App\Models\User;
use App\Notifications\CustomerOrderStatusChanged;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use ZipArchive;

/**
 * @return array{Tenant, Plan}
 */
function createTenantPanelTenant(int $maxBranches = 3, int $maxProducts = 20): array
{
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    foreach (['tenant-admin', 'branch-manager', 'sales-man'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }

    $plan = Plan::create([
        'name' => 'Tenant Panel Plan '.uniqid(),
        'price' => 1000,
        'interval' => 'monthly',
        'max_branches' => $maxBranches,
        'max_products' => $maxProducts,
        'is_active' => true,
    ]);
    $tenant = Tenant::create([
        'name' => 'Tenant Panel Shop '.uniqid(),
        'slug' => 'tenant-panel-'.uniqid(),
        'email' => 'shop-'.uniqid().'@example.com',
        'status' => 'active',
    ]);
    $tenant->subscriptions()->create([
        'plan_id' => $plan->id,
        'starts_at' => today()->subDay(),
        'ends_at' => today()->addMonth(),
        'status' => 'active',
    ]);

    return [$tenant, $plan];
}

function createTenantPanelUser(Tenant $tenant, string $role = 'tenant-admin', ?Branch $branch = null): User
{
    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'branch_id' => $branch?->id,
    ]);
    $user->assignRole($role);

    return $user;
}

function createTenantPanelBranch(Tenant $tenant, string $name = 'Panel Branch'): Branch
{
    return $tenant->branches()->create([
        'name' => $name.' '.uniqid(),
        'address' => '1 Market Street',
        'city' => 'Dhaka',
        'phone' => '+8801700000000',
        'is_active' => true,
    ]);
}

function createTenantPanelProduct(Tenant $tenant, string $slug = 'panel-product'): Product
{
    $category = Category::create([
        'name' => 'Panel Category '.uniqid(),
        'slug' => 'panel-category-'.uniqid(),
    ]);

    return Product::create([
        'tenant_id' => $tenant->id,
        'category_id' => $category->id,
        'name' => 'Panel Product',
        'slug' => $slug.'-'.uniqid(),
        'description' => 'Panel product description.',
        'base_price' => 900,
        'is_active' => true,
    ]);
}

function createTenantPanelVariant(Product $product, ?Branch $branch = null, int $quantity = 10, float $price = 450.0): ProductVariant
{
    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'SKU-'.strtoupper(uniqid()),
        'size' => 'M',
        'color' => 'Black',
        'price' => $price,
    ]);

    if ($branch !== null) {
        $branch->stocks()->create([
            'variant_id' => $variant->id,
            'quantity' => $quantity,
        ]);
    }

    return $variant;
}

test('tenant admins can open the POS page with branch products', function () {
    [$tenant] = createTenantPanelTenant();
    $branch = createTenantPanelBranch($tenant, 'Main');
    $admin = createTenantPanelUser($tenant);
    $product = createTenantPanelProduct($tenant);
    $variant = createTenantPanelVariant($product, $branch);

    $this->actingAs($admin, 'web')
        ->get(route('tenant.pos.index', ['branch_id' => $branch->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Tenant/Pos/Index')
            ->where('selectedBranchId', $branch->id)
            ->has('products', 1)
            ->where('products.0.name', $product->name)
            ->where('products.0.variants.0.sku', $variant->sku)
            ->where('products.0.variants.0.barcode', $variant->barcode_code)
            ->where('products.0.variants.0.stock', 10)
            ->where('categories.0.name', $product->category->name));
});

test('branch managers are locked to their assigned branch in the POS', function () {
    [$tenant] = createTenantPanelTenant();
    $assignedBranch = createTenantPanelBranch($tenant, 'Assigned');
    $otherBranch = createTenantPanelBranch($tenant, 'Other');
    $manager = createTenantPanelUser($tenant, 'branch-manager', $assignedBranch);
    $product = createTenantPanelProduct($tenant);
    $variant = createTenantPanelVariant($product, $otherBranch);

    $this->actingAs($manager, 'web')
        ->get(route('tenant.pos.index', ['branch_id' => $otherBranch->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Tenant/Pos/Index')
            ->where('selectedBranchId', $assignedBranch->id)
            ->has('branches', 1)
            ->where('branches.0.id', $assignedBranch->id)
            ->has('products', 1)
            ->where('products.0.variants.0.sku', $variant->sku)
            ->where('products.0.variants.0.stock', 0));
});

test('product variants auto-generate unique 5 character barcode codes', function () {
    [$tenant] = createTenantPanelTenant();
    $branch = createTenantPanelBranch($tenant);
    $product = createTenantPanelProduct($tenant);

    $first = createTenantPanelVariant($product, $branch);
    $second = $product->variants()->create(['sku' => 'SKU-SECOND-'.uniqid(), 'price' => 100.0]);

    expect(preg_match('/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}$/', strval($first->barcode_code)))->toBe(1)
        ->and(preg_match('/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}$/', strval($second->barcode_code)))->toBe(1)
        ->and($first->barcode_code)->not()->toBe($second->barcode_code)
        ->and(ProductVariant::query()->where('barcode_code', $first->barcode_code)->count())->toBe(1)
        ->and(ProductVariant::query()->where('barcode_code', $second->barcode_code)->count())->toBe(1);
});

test('stock label PDFs print branch barcode sheets in new tab', function () {
    [$tenant] = createTenantPanelTenant();
    $branch = createTenantPanelBranch($tenant, 'Main');
    $admin = createTenantPanelUser($tenant);
    $product = createTenantPanelProduct($tenant);
    $variant = createTenantPanelVariant($product, $branch);

    $content = $this->actingAs($admin, 'web')
        ->get(route('tenant.stock.labels', [
            'branch_id' => $branch->id,
            'paper' => 'a4',
            'size' => '50x25',
        ]))
        ->assertOk();

    $pdf = strval($content->getContent());

    expect($content->headers->get('Content-Type'))->toBe('application/pdf')
        ->and(str_starts_with($pdf, '%PDF-'))->toBeTrue()
        ->and($content->headers->get('Content-Disposition'))->toContain('inline')
        ->and($pdf)->toContain('('.strval($variant->barcode_code).')')
        ->and($pdf)->toContain('(SL-01)')
        ->and(substr_count($pdf, '/Type /Page '))->toBe(1);
});

test('stock labels show struck regular price when a discount applies', function () {
    [$tenant] = createTenantPanelTenant();
    $branch = createTenantPanelBranch($tenant, 'Main');
    $admin = createTenantPanelUser($tenant);
    $product = createTenantPanelProduct($tenant);
    $product->update(['base_price' => 1000]);
    createTenantPanelVariant($product, $branch, price: 750.0);

    $pdf = strval($this->actingAs($admin, 'web')
        ->get(route('tenant.stock.labels', ['branch_id' => $branch->id]))
        ->assertOk()
        ->getContent());

    expect($pdf)->toContain('(Tk 1,000.00)')
        ->and($pdf)->toContain('(Tk 750.00)')
        ->and($pdf)->toContain('0.35 G 0.5 w'); // strike-through rule
});

test('stock label PDFs respect requested paper format and settings', function () {
    [$tenant] = createTenantPanelTenant();
    $branch = createTenantPanelBranch($tenant, 'Main');
    $admin = createTenantPanelUser($tenant);
    $product = createTenantPanelProduct($tenant);
    createTenantPanelVariant($product, $branch);

    $pdf = strval($this->actingAs($admin, 'web')
        ->get(route('tenant.stock.labels', [
            'branch_id' => $branch->id,
            'paper' => 'letter',
            'size' => '38x21',
            'show' => ['name', 'price'],
        ]))
        ->assertOk()
        ->getContent());

    expect($pdf)->toContain('[0 0 612 792]')
        ->and($pdf)->toContain('(Tk')
        ->and($pdf)->not()->toContain('(SL-');
});

test('stock labels can print a single product variant only', function () {
    [$tenant] = createTenantPanelTenant();
    $branch = createTenantPanelBranch($tenant, 'Main');
    $admin = createTenantPanelUser($tenant);
    $product = createTenantPanelProduct($tenant);
    $included = createTenantPanelVariant($product, $branch);
    $excluded = createTenantPanelVariant($product, $branch);

    $pdf = strval($this->actingAs($admin, 'web')
        ->get(route('tenant.stock.labels', [
            'branch_id' => $branch->id,
            'variant_ids' => [$included->id],
        ]))
        ->assertOk()
        ->getContent());

    expect($pdf)->toContain('('.strval($included->barcode_code).')')
        ->and($pdf)->toContain('(SL-01)')
        ->and($pdf)->not()->toContain('('.strval($excluded->barcode_code).')');
});

test('individual product labels loop to fill one page of A4 sheet paper', function () {
    [$tenant] = createTenantPanelTenant();
    $branch = createTenantPanelBranch($tenant, 'Main');
    $admin = createTenantPanelUser($tenant);
    $product = createTenantPanelProduct($tenant);
    $variant = createTenantPanelVariant($product, $branch);

    $pdf = strval($this->actingAs($admin, 'web')
        ->get(route('tenant.stock.labels', [
            'branch_id' => $branch->id,
            'variant_ids' => [$variant->id],
        ]))
        ->assertOk()
        ->getContent());

    // 50x25 on A4: 3 columns x 10 rows = 30 labels, exactly one page.
    expect(substr_count($pdf, '(SL-'))->toBe(30)
        ->and(substr_count($pdf, '('.strval($variant->barcode_code).')'))->toBe(30)
        ->and(substr_count($pdf, '/Type /Page '))->toBe(1);
});

test('individual product labels loop to fill one page of A5 sheet paper', function () {
    [$tenant] = createTenantPanelTenant();
    $branch = createTenantPanelBranch($tenant, 'Main');
    $admin = createTenantPanelUser($tenant);
    $product = createTenantPanelProduct($tenant);
    $variant = createTenantPanelVariant($product, $branch);

    $pdf = strval($this->actingAs($admin, 'web')
        ->get(route('tenant.stock.labels', [
            'branch_id' => $branch->id,
            'paper' => 'a5',
            'variant_ids' => [$variant->id],
        ]))
        ->assertOk()
        ->getContent());

    // 50x25 on A5: 2 columns x 7 rows = 14 labels, exactly one page.
    expect(substr_count($pdf, '(SL-'))->toBe(14)
        ->and(substr_count($pdf, '('.strval($variant->barcode_code).')'))->toBe(14)
        ->and(substr_count($pdf, '/Type /Page '))->toBe(1);
});

test('individual product labels adapt the loop count to larger label sizes', function () {
    [$tenant] = createTenantPanelTenant();
    $branch = createTenantPanelBranch($tenant, 'Main');
    $admin = createTenantPanelUser($tenant);
    $product = createTenantPanelProduct($tenant);
    $variant = createTenantPanelVariant($product, $branch);

    $pdf = strval($this->actingAs($admin, 'web')
        ->get(route('tenant.stock.labels', [
            'branch_id' => $branch->id,
            'size' => '57x50',
            'variant_ids' => [$variant->id],
        ]))
        ->assertOk()
        ->getContent());

    // 57x50 on A4: 3 columns x 5 rows = 15 labels, still exactly one page.
    expect(substr_count($pdf, '(SL-'))->toBe(15)
        ->and(substr_count($pdf, '/Type /Page '))->toBe(1);
});

test('thermal paper does not loop individual product labels', function () {
    [$tenant] = createTenantPanelTenant();
    $branch = createTenantPanelBranch($tenant, 'Main');
    $admin = createTenantPanelUser($tenant);
    $product = createTenantPanelProduct($tenant);
    $variant = createTenantPanelVariant($product, $branch);

    $pdf = strval($this->actingAs($admin, 'web')
        ->get(route('tenant.stock.labels', [
            'branch_id' => $branch->id,
            'paper' => 'thermal',
            'variant_ids' => [$variant->id],
        ]))
        ->assertOk()
        ->getContent());

    expect(substr_count($pdf, '(SL-'))->toBe(1)
        ->and(substr_count($pdf, '/Type /Page '))->toBe(1);
});

test('stock labels can show the SKU in the serial slot instead of the code', function () {
    [$tenant] = createTenantPanelTenant();
    $branch = createTenantPanelBranch($tenant, 'Main');
    $admin = createTenantPanelUser($tenant);
    $product = createTenantPanelProduct($tenant);
    $variant = createTenantPanelVariant($product, $branch);

    $pdf = strval($this->actingAs($admin, 'web')
        ->get(route('tenant.stock.labels', [
            'branch_id' => $branch->id,
            'show' => ['branch', 'name', 'barcode', 'sku', 'price'],
        ]))
        ->assertOk()
        ->getContent());

    expect($pdf)->toContain('('.strval($variant->sku).')')
        ->and($pdf)->not()->toContain('(SL-')
        ->and($pdf)->not()->toContain('('.strval($variant->barcode_code).')');
});

test('stock labels support thermal printers with the label as the exact page size', function () {
    [$tenant] = createTenantPanelTenant();
    $branch = createTenantPanelBranch($tenant, 'Main');
    $admin = createTenantPanelUser($tenant);
    $product = createTenantPanelProduct($tenant);
    $first = createTenantPanelVariant($product, $branch);
    $second = createTenantPanelVariant($product, $branch);

    $pdf = strval($this->actingAs($admin, 'web')
        ->get(route('tenant.stock.labels', [
            'branch_id' => $branch->id,
            'paper' => 'thermal',
            'size' => '40x30',
        ]))
        ->assertOk()
        ->getContent());

    $pages = substr_count($pdf, '/Type /Page ');

    expect($pdf)->toContain('[0 0 113.39 85.04]')
        ->and($pdf)->toContain('('.strval($first->barcode_code).')')
        ->and($pdf)->toContain('('.strval($second->barcode_code).')')
        ->and($pdf)->toContain('(SL-01)')
        ->and($pages)->toBe(2)
        ->and($pdf)->not()->toContain('0.55 G 0.4 w');
});

test('stock labels support custom thermal paper sizes in millimetres', function () {
    [$tenant] = createTenantPanelTenant();
    $branch = createTenantPanelBranch($tenant, 'Main');
    $admin = createTenantPanelUser($tenant);
    $product = createTenantPanelProduct($tenant);
    createTenantPanelVariant($product, $branch);

    $pdf = strval($this->actingAs($admin, 'web')
        ->get(route('tenant.stock.labels', [
            'branch_id' => $branch->id,
            'paper' => 'thermal',
            'size' => 'custom',
            'width' => 57,
            'height' => 40,
        ]))
        ->assertOk()
        ->getContent());

    expect($pdf)->toContain('[0 0 161.57 113.39]')
        ->and($pdf)->toContain('(SL-01)');
});

test('thermal labels keep the barcode tight under the name and text inside the label', function () {
    [$tenant] = createTenantPanelTenant();
    $branch = createTenantPanelBranch($tenant, 'Main');
    $admin = createTenantPanelUser($tenant);
    $product = createTenantPanelProduct($tenant);
    createTenantPanelVariant($product, $branch);

    $pdf = strval($this->actingAs($admin, 'web')
        ->get(route('tenant.stock.labels', [
            'branch_id' => $branch->id,
            'paper' => 'thermal',
            'size' => '57x50',
        ]))
        ->assertOk()
        ->getContent());

    preg_match_all('/1 0 0 1 [\d.]+ ([\d.]+) Tm /', $pdf, $matches);
    $textBaselines = array_map('floatval', $matches[1]);
    rsort($textBaselines);

    preg_match_all('/([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+) re f /', $pdf, $bars, PREG_SET_ORDER);
    $barsTop = 0.0;

    foreach ($bars as $bar) {
        $barsTop = max($barsTop, floatval($bar[2]) + floatval($bar[4]));
    }

    // Branch baseline, then the product name right below it, then the
    // barcode bars: at most a small fixed gap between name and barcode.
    $hostname = $textBaselines[0];
    $nameY = $textBaselines[1];

    expect($hostname)->toBeLessThanOrEqual(141.73 - 5.0)
        ->and($nameY - $barsTop)->toBeLessThan(8.0);
});

test('stock labels reject invalid custom paper sizes', function () {
    [$tenant] = createTenantPanelTenant();
    $branch = createTenantPanelBranch($tenant, 'Main');
    $admin = createTenantPanelUser($tenant);
    $product = createTenantPanelProduct($tenant);
    createTenantPanelVariant($product, $branch);

    $this->actingAs($admin, 'web')
        ->get(route('tenant.stock.labels', [
            'branch_id' => $branch->id,
            'size' => 'custom',
            'width' => 5,
            'height' => 40,
        ]))
        ->assertStatus(302)
        ->assertSessionHasErrors('width');
});

test('stock labels are scoped to the tenant and branch assignment', function () {
    [$tenant] = createTenantPanelTenant();
    createTenantPanelBranch($tenant, 'Main');

    [$otherTenant] = createTenantPanelTenant();
    $otherBranch = createTenantPanelBranch($otherTenant, 'Other');
    $otherAdmin = createTenantPanelUser($otherTenant);

    // A foreign tenant admin cannot render another tenant's labels.
    $this->actingAs($otherAdmin, 'web')
        ->get(route('tenant.stock.labels', ['branch_id' => $otherBranch->id, 'paper' => 'a4']))
        ->assertOk();

    $admin = createTenantPanelUser($tenant);

    $this->actingAs($admin, 'web')
        ->get(route('tenant.stock.labels', ['branch_id' => $otherBranch->id]))
        ->assertNotFound();
});

test('branch managers cannot print labels for other branches', function () {
    [$tenant] = createTenantPanelTenant();
    $assignedBranch = createTenantPanelBranch($tenant, 'Assigned');
    $otherBranch = createTenantPanelBranch($tenant, 'Other');
    $manager = createTenantPanelUser($tenant, 'branch-manager', $assignedBranch);

    $this->actingAs($manager, 'web')
        ->get(route('tenant.stock.labels', ['branch_id' => $otherBranch->id]))
        ->assertNotFound();
});

test('POS checkout works when the variant is resolved by its barcode code', function () {
    [$tenant] = createTenantPanelTenant();
    $branch = createTenantPanelBranch($tenant, 'Main');
    $admin = createTenantPanelUser($tenant);
    $product = createTenantPanelProduct($tenant);
    $variant = createTenantPanelVariant($product, $branch, quantity: 3);

    // A real scanner types the barcode code into the scan field; the POS page
    // then resolves the variant by that code and posts its id to checkout.
    $scannedVariantId = (int) ProductVariant::query()
        ->where('barcode_code', $variant->barcode_code)
        ->value('id');

    $this->actingAs($admin, 'web')
        ->withoutMiddleware(ValidateCsrfToken::class)
        ->post(route('tenant.pos.checkout'), [
            'branch_id' => $branch->id,
            'items' => [['variant_id' => $scannedVariantId, 'quantity' => 1]],
            'payment_method' => 'cod',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('tenant.pos.index', ['branch_id' => $branch->id]));

    expect($scannedVariantId)->toBe($variant->id)
        ->and($variant->stocks()->where('branch_id', $branch->id)->first()->quantity)->toBe(2);
});

test('checkout records a paid POS sale and decrements branch stock', function () {
    [$tenant] = createTenantPanelTenant();
    [$otherTenant] = createTenantPanelTenant();
    $branch = createTenantPanelBranch($tenant, 'Main');
    $admin = createTenantPanelUser($tenant);

    // Pre-populate the branch_stocks table with unrelated rows so the stock
    // lookup cannot pass through a coincidental id/variant_id alignment.
    $noiseProduct = createTenantPanelProduct($otherTenant);
    $noiseBranch = createTenantPanelBranch($otherTenant, 'Noise');
    createTenantPanelVariant($noiseProduct, $noiseBranch, quantity: 5);
    createTenantPanelVariant($noiseProduct, $noiseBranch, quantity: 6);

    $product = createTenantPanelProduct($tenant);
    $variant = createTenantPanelVariant($product, $branch, quantity: 10, price: 450.0);

    $this->actingAs($admin, 'web')
        ->withoutMiddleware(ValidateCsrfToken::class)
        ->post(route('tenant.pos.checkout'), [
            'branch_id' => $branch->id,
            'items' => [['variant_id' => $variant->id, 'quantity' => 2]],
            'payment_method' => 'cod',
            'discount' => '50',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('tenant.pos.index', ['branch_id' => $branch->id]));

    $order = Order::query()->firstOrFail();
    $subOrder = SubOrder::query()->firstOrFail();
    $subOrderId = $subOrder->id;

    expect(str_starts_with($order->order_no, 'POS-'))->toBeTrue()
        ->and((float) $order->subtotal)->toBe(900.0)
        ->and((float) $order->discount)->toBe(50.0)
        ->and((float) $order->total)->toBe(850.0)
        ->and($order->payment_status)->toBe('paid')
        ->and((float) $subOrder->total)->toBe(850.0)
        ->and($subOrder->status)->toBe('delivered')
        ->and($subOrder->shipping_fee_status)->toBe('paid')
        ->and($subOrder->items()->count())->toBe(1)
        ->and($subOrder->trackings()->count())->toBe(1)
        ->and($order->payments()->where('status', 'paid')->count())->toBe(1)
        ->and(Customer::where('name', 'Walk-in Customer')->count())->toBe(1)
        ->and($variant->stocks()->where('branch_id', $branch->id)->first()->quantity)
        ->toBe(8);

    $response = $this->actingAs($admin, 'web')
        ->followingRedirects()
        ->get(route('tenant.pos.index', ['branch_id' => $branch->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('lastSale.order_no', $order->order_no)
            ->where('lastSale.sub_order_id', $subOrderId));

    $receipt = $this->actingAs($admin, 'web')
        ->get(route('tenant.pos.receipt', $subOrder))
        ->assertOk();

    expect($receipt->headers->get('Content-Type'))->toBe('application/pdf')
        ->and(str_starts_with(strval($receipt->getContent()), '%PDF-'))->toBeTrue()
        ->and($receipt->headers->get('Content-Disposition'))->toContain('inline');
});

test('checkout records customer overpayment and receipt shows change', function () {
    [$tenant] = createTenantPanelTenant();
    $branch = createTenantPanelBranch($tenant, 'Main');
    $admin = createTenantPanelUser($tenant);

    $product = createTenantPanelProduct($tenant);
    $variant = createTenantPanelVariant($product, $branch, quantity: 10, price: 450.0);

    $this->actingAs($admin, 'web')
        ->withoutMiddleware(ValidateCsrfToken::class)
        ->post(route('tenant.pos.checkout'), [
            'branch_id' => $branch->id,
            'items' => [['variant_id' => $variant->id, 'quantity' => 1]],
            'payment_method' => 'cod',
            'paid_amount' => '500',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('tenant.pos.index', ['branch_id' => $branch->id]));

    $order = Order::query()->where('order_no', 'LIKE', 'POS-%')->firstOrFail();
    $subOrder = SubOrder::query()->firstOrFail();

    expect((float) $order->total)->toBe(450.0)
        ->and((float) $order->payments()->first()->amount)->toBe(500.0);

    $receipt = $this->actingAs($admin, 'web')
        ->get(route('tenant.pos.receipt', $subOrder))
        ->assertOk();

    $content = strval($receipt->getContent());

    expect($content)->toContain('(Paid \\(Cash\\))')
        ->and($content)->toContain('(500.00)')
        ->and($content)->toContain('(Change)')
        ->and($content)->toContain('(50.00)');
});

test('pos receipt is protected from other tenants and branches', function () {
    [$tenant] = createTenantPanelTenant();
    [$otherTenant] = createTenantPanelTenant();
    $branch = createTenantPanelBranch($tenant, 'Main');
    $assignedBranch = createTenantPanelBranch($tenant, 'Assigned');
    $admin = createTenantPanelUser($tenant);
    $foreignUser = createTenantPanelUser($otherTenant);
    $manager = createTenantPanelUser($tenant, 'branch-manager', $assignedBranch);
    $product = createTenantPanelProduct($tenant);
    $variant = createTenantPanelVariant($product, $branch, quantity: 5);

    $this->actingAs($admin, 'web')
        ->withoutMiddleware(ValidateCsrfToken::class)
        ->post(route('tenant.pos.checkout'), [
            'branch_id' => $branch->id,
            'items' => [['variant_id' => $variant->id, 'quantity' => 1]],
            'payment_method' => 'card',
        ])
        ->assertSessionHasNoErrors();

    $subOrder = SubOrder::query()->firstOrFail();

    $this->actingAs($foreignUser, 'web')
        ->get(route('tenant.pos.receipt', $subOrder))
        ->assertNotFound();

    $this->actingAs($manager, 'web')
        ->get(route('tenant.pos.receipt', $subOrder))
        ->assertForbidden();
});

test('branch sales staff can create a POS sale and view its invoice only for their branch', function () {
    [$tenant] = createTenantPanelTenant();
    $branch = createTenantPanelBranch($tenant, 'Assigned');
    $otherBranch = createTenantPanelBranch($tenant, 'Other');
    $seller = createTenantPanelUser($tenant, 'sales-man', $branch);
    $product = createTenantPanelProduct($tenant);
    $variant = createTenantPanelVariant($product, $branch, quantity: 5);

    $this->actingAs($seller, 'web')
        ->get(route('tenant.pos.index', ['branch_id' => $otherBranch->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('selectedBranchId', $branch->id)
            ->has('branches', 1)
        );

    $this->post(route('tenant.pos.checkout'), [
        'branch_id' => $branch->id,
        'items' => [['variant_id' => $variant->id, 'quantity' => 1]],
        'payment_method' => 'cod',
    ])->assertRedirect(route('tenant.pos.index', ['branch_id' => $branch->id]));

    $subOrder = SubOrder::query()->firstOrFail();

    $this->get(route('tenant.pos.invoice', $subOrder))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Tenant/Pos/Invoice')
            ->where('invoice.order_no', $subOrder->order->order_no)
            ->where('invoice.branch.name', $branch->name)
            ->where('invoice.items.0.name', 'Panel Product - Black / M')
        );

    $otherBranchOrder = SubOrder::query()->create([
        'order_id' => $subOrder->order_id,
        'tenant_id' => $tenant->id,
        'branch_id' => $otherBranch->id,
        'total' => 0,
        'status' => 'delivered',
    ]);

    $this->get(route('tenant.pos.invoice', $otherBranchOrder))
        ->assertForbidden();

    $this->get(route('tenant.pos.invoices'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Tenant/Pos/Invoices')
            ->has('invoices.data', 1)
            ->where('invoices.data.0.branch.id', $branch->id)
            ->where('invoices.data.0.order.order_no', $subOrder->order->order_no)
        );

    $admin = createTenantPanelUser($tenant);
    $this->actingAs($admin, 'web')
        ->get(route('tenant.pos.invoices'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Tenant/Pos/Invoices')
            ->has('invoices.data', 2)
        );
});

test('checkout rejects quantities above branch stock', function () {
    [$tenant] = createTenantPanelTenant();
    $branch = createTenantPanelBranch($tenant, 'Main');
    $admin = createTenantPanelUser($tenant);
    $product = createTenantPanelProduct($tenant);
    $variant = createTenantPanelVariant($product, $branch, quantity: 3);

    $this->actingAs($admin, 'web')
        ->withoutMiddleware(ValidateCsrfToken::class)
        ->post(route('tenant.pos.checkout'), [
            'branch_id' => $branch->id,
            'items' => [['variant_id' => $variant->id, 'quantity' => 99]],
            'payment_method' => 'cod',
        ])
        ->assertSessionHasErrors('items');

    expect($variant->stocks()->where('branch_id', $branch->id)->first()->quantity)
        ->toBe(3)
        ->and(Order::count())->toBe(0);
});

test('checkout rejects variants outside the branch tenant', function () {
    [$tenant] = createTenantPanelTenant();
    [$otherTenant] = createTenantPanelTenant();
    $branch = createTenantPanelBranch($tenant, 'Main');
    $admin = createTenantPanelUser($tenant);
    $foreignProduct = createTenantPanelProduct($otherTenant);
    $variant = createTenantPanelVariant($foreignProduct);

    $this->actingAs($admin, 'web')
        ->withoutMiddleware(ValidateCsrfToken::class)
        ->post(route('tenant.pos.checkout'), [
            'branch_id' => $branch->id,
            'items' => [['variant_id' => $variant->id, 'quantity' => 1]],
            'payment_method' => 'cod',
        ])
        ->assertSessionHasErrors('items');

    expect(Order::count())->toBe(0);
});

test('tenant admins can open the branches page', function () {
    [$tenant] = createTenantPanelTenant();
    $admin = createTenantPanelUser($tenant);

    $this->actingAs($admin, 'web')
        ->get(route('tenant.branches.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Tenant/Branches/Index')
            ->has('branches.data')
            ->where('canManage', true));
});

test('branch managers can browse only their assigned branch', function () {
    [$tenant] = createTenantPanelTenant();
    $assignedBranch = createTenantPanelBranch($tenant, 'Assigned');
    createTenantPanelBranch($tenant, 'Other');
    $manager = createTenantPanelUser($tenant, 'branch-manager', $assignedBranch);

    $this->actingAs($manager, 'web')
        ->get(route('tenant.branches.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Tenant/Branches/Index')
            ->where('canManage', false)
            ->has('branches.data', 1)
            ->where('branches.data.0.id', $assignedBranch->id)
            ->where('branches.total', 1));
});

test('tenant admins can list only their own staff and create users with tenant roles', function () {
    [$tenant] = createTenantPanelTenant();
    [$otherTenant] = createTenantPanelTenant();
    $branch = createTenantPanelBranch($tenant, 'Main');
    $admin = createTenantPanelUser($tenant);
    $otherUser = createTenantPanelUser($otherTenant);

    $this->actingAs($admin, 'web')
        ->get(route('tenant.users.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Tenant/Users/Index')
            ->has('users.data', 1)
            ->where('users.data.0.id', $admin->id)
            ->missing('users.data.1')
            ->has('branches', 1));

    $this->post(route('tenant.users.store'), [
        'name' => 'Branch Staff',
        'email' => 'branch-staff@example.com',
        'phone' => '+8801700000001',
        'password' => 'BranchPass123!',
        'password_confirmation' => 'BranchPass123!',
        'role' => 'branch-manager',
        'branch_id' => $branch->id,
        'tenant_id' => $otherTenant->id,
    ])->assertSessionHasErrors('tenant_id');

    $this->post(route('tenant.users.store'), [
        'name' => 'Branch Staff',
        'email' => 'branch-staff@example.com',
        'phone' => '+8801700000001',
        'password' => 'BranchPass123!',
        'password_confirmation' => 'BranchPass123!',
        'role' => 'branch-manager',
        'branch_id' => $branch->id,
    ])->assertRedirect();

    $created = User::where('email', 'branch-staff@example.com')->firstOrFail();
    expect($created->tenant_id)->toBe($tenant->id)
        ->and($created->branch_id)->toBe($branch->id)
        ->and($created->hasRole('branch-manager'))->toBeTrue()
        ->and($created->hasRole('super-admin'))->toBeFalse()
        ->and(User::find($otherUser->id))->not->toBeNull();
});

test('tenant admins can update a users details and assigned role', function () {
    [$tenant] = createTenantPanelTenant();
    $branch = createTenantPanelBranch($tenant, 'Assigned');
    $admin = createTenantPanelUser($tenant);
    $staff = createTenantPanelUser($tenant, 'branch-manager', $branch);

    $this->actingAs($admin, 'web')
        ->put(route('tenant.users.update', $staff), [
            'name' => 'Updated Staff',
            'email' => $staff->email,
            'phone' => '+8801700000002',
            'role' => 'tenant-admin',
            'branch_id' => '',
            'password' => '',
            'password_confirmation' => '',
        ])
        ->assertRedirect();

    expect($staff->fresh()->name)->toBe('Updated Staff')
        ->and($staff->fresh()->phone)->toBe('+8801700000002')
        ->and($staff->fresh()->branch_id)->toBeNull()
        ->and($staff->fresh()->hasRole('tenant-admin'))->toBeTrue()
        ->and($staff->fresh()->hasRole('branch-manager'))->toBeFalse();
});

test('branch managers cannot manage staff users and tenant admins cannot assign foreign branches', function () {
    [$tenant] = createTenantPanelTenant();
    [$otherTenant] = createTenantPanelTenant();
    $branch = createTenantPanelBranch($tenant);
    $foreignBranch = createTenantPanelBranch($otherTenant);
    $admin = createTenantPanelUser($tenant);
    $manager = createTenantPanelUser($tenant, 'branch-manager', $branch);

    $this->actingAs($manager, 'web')
        ->get(route('tenant.users.index'))
        ->assertForbidden();

    $this->actingAs($admin, 'web')
        ->post(route('tenant.users.store'), [
            'name' => 'Invalid Staff',
            'email' => 'invalid-staff@example.com',
            'password' => 'BranchPass123!',
            'password_confirmation' => 'BranchPass123!',
            'role' => 'branch-manager',
            'branch_id' => $foreignBranch->id,
        ])
        ->assertSessionHasErrors('branch_id');

    $this->put(route('tenant.users.update', $admin), [
        'name' => 'Changed Own Role',
        'email' => $admin->email,
        'phone' => '',
        'role' => 'branch-manager',
        'branch_id' => $branch->id,
        'password' => '',
        'password_confirmation' => '',
    ])->assertSessionHasErrors(['role', 'branch_id']);
});

test('tenant admins see only their own products and orders', function () {
    [$tenant] = createTenantPanelTenant();
    [$otherTenant] = createTenantPanelTenant();
    $admin = createTenantPanelUser($tenant);
    $ownProduct = createTenantPanelProduct($tenant, 'own-product');
    $otherProduct = createTenantPanelProduct($otherTenant, 'other-product');
    $ownBranch = createTenantPanelBranch($tenant, 'Own');
    $otherBranch = createTenantPanelBranch($otherTenant, 'Other');
    $customer = Customer::factory()->create();
    $ownOrder = $customer->orders()->create([
        'order_no' => 'OWN-'.strtoupper(uniqid()),
        'shipping_address' => ['city' => 'Dhaka'],
        'subtotal' => 100,
        'total' => 100,
        'payment_method' => 'cod',
    ]);
    $otherOrder = $customer->orders()->create([
        'order_no' => 'OTHER-'.strtoupper(uniqid()),
        'shipping_address' => ['city' => 'Dhaka'],
        'subtotal' => 100,
        'total' => 100,
        'payment_method' => 'cod',
    ]);
    $ownSubOrder = $ownOrder->subOrders()->create([
        'tenant_id' => $tenant->id,
        'branch_id' => $ownBranch->id,
        'total' => 100,
        'status' => 'pending',
    ]);
    $otherSubOrder = $otherOrder->subOrders()->create([
        'tenant_id' => $otherTenant->id,
        'branch_id' => $otherBranch->id,
        'total' => 100,
        'status' => 'pending',
    ]);

    $this->actingAs($admin, 'web')
        ->get(route('tenant.products.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 1)
            ->where('products.data.0.id', $ownProduct->id)
            ->where('products.data.0.id', fn ($id) => $id !== $otherProduct->id));

    $this->get(route('tenant.orders.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('orders.data', 1)
            ->where('orders.data.0.id', $ownSubOrder->id)
            ->where('orders.data.0.id', fn ($id) => $id !== $otherSubOrder->id));
});

test('expired tenant subscriptions allow read-only access but block changes', function () {
    [$tenant, $plan] = createTenantPanelTenant();
    $user = createTenantPanelUser($tenant);
    $tenant->subscriptions()->update(['status' => 'expired']);

    $this->actingAs($user, 'web')
        ->get(route('tenant.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('tenantReadOnly', true));
    $this->post(route('tenant.branches.store'), [
        'name' => 'Forbidden branch',
        'address' => '1 Test Road',
        'city' => 'Dhaka',
        'phone' => '+8801700000000',
        'delivery_costs' => [['area' => 'Dhaka', 'cost' => 50]],
    ])->assertForbidden();

    $tenant->subscriptions()->update([
        'status' => 'active',
        'ends_at' => today()->subDay(),
    ]);

    $this->get(route('tenant.dashboard'))->assertOk();
    $this->put(route('tenant.stock.update'))->assertForbidden();
});

test('tenant admin can create branches up to the subscription plan limit', function () {
    [$tenant] = createTenantPanelTenant(maxBranches: 1);
    $admin = createTenantPanelUser($tenant);
    $this->actingAs($admin, 'web');

    $branchData = [
        'name' => 'Limit Branch',
        'address' => '1 Test Road',
        'city' => 'Dhaka',
        'phone' => '+8801700000000',
        'delivery_costs' => [
            ['area' => 'Inside Dhaka', 'cost' => 50],
            ['area' => 'Outside Dhaka', 'cost' => 120],
        ],
    ];

    $this->post(route('tenant.branches.store'), $branchData)
        ->assertRedirect();
    $branch = Branch::where('tenant_id', $tenant->id)->firstOrFail();
    expect($branch->deliveryCosts()->count())->toBe(2)
        ->and($branch->deliveryCosts()->where('area', 'Outside Dhaka')->value('cost'))
        ->toBe('120.00');

    $this->put(route('tenant.branches.update', $branch), [
        ...$branchData,
        'name' => $branch->name,
        'is_active' => true,
        'delivery_costs' => [
            ['area' => 'Mirpur', 'cost' => 80],
        ],
    ])->assertRedirect();

    expect($branch->deliveryCosts()->count())->toBe(1)
        ->and($branch->deliveryCosts()->firstOrFail()->area)->toBe('Mirpur');

    $this->post(route('tenant.branches.store'), [
        ...$branchData,
        'name' => 'Second Branch',
    ])->assertSessionHasErrors('name');

    expect(Branch::where('tenant_id', $tenant->id)->count())->toBe(1);
});

test('tenant admin can create product variants extra attributes and uploaded images', function () {
    Storage::fake('public');
    [$tenant] = createTenantPanelTenant(maxProducts: 1);
    $admin = createTenantPanelUser($tenant);
    $category = Category::create(['name' => 'Apparel', 'slug' => 'panel-apparel']);
    $brand = Brand::create(['name' => 'Panel Brand', 'slug' => 'panel-brand']);
    $attribute = ProductAttribute::create(['name' => 'Panel Material']);

    $data = [
        'name' => 'Tenant Product',
        'slug' => 'tenant-product',
        'description' => 'A product created from the tenant panel.',
        'category_id' => $category->id,
        'brand_id' => $brand->id,
        'gender' => 'unisex',
        'base_price' => 1500,
        'sale_price' => 1200,
        'is_active' => true,
        'variants' => [
            ['sku' => 'TENANT-PANEL-SKU-1', 'size' => 'M', 'color' => 'Blue', 'price' => 1200],
        ],
        'attributes' => [
            ['attribute_id' => $attribute->id, 'value' => 'Cotton'],
        ],
        'images' => [
            UploadedFile::fake()->image('front.png'),
            UploadedFile::fake()->image('back.png'),
        ],
    ];

    $this->actingAs($admin, 'web')
        ->post(route('tenant.products.store'), $data)
        ->assertRedirect();

    $product = Product::withoutGlobalScopes()->where('slug', 'tenant-product')->firstOrFail();
    expect($product->tenant_id)->toBe($tenant->id)
        ->and($product->variants)->toHaveCount(1)
        ->and($product->attributeValues()->first()->value)->toBe('Cotton')
        ->and($product->images)->toHaveCount(2);
    Storage::disk('public')->assertExists($product->images->first()->path);

    $this->post(route('tenant.products.store'), [
        ...$data,
        'name' => 'Over Limit Product',
        'slug' => 'over-limit-product',
        'variants' => [
            ['sku' => 'TENANT-PANEL-SKU-2', 'size' => 'L', 'color' => 'Black'],
        ],
        'images' => [],
    ])->assertSessionHasErrors('name');
});

test('branch managers can only update stock and orders for their assigned branch', function () {
    $this->withoutMiddleware(
        ValidateCsrfToken::class,
    );
    Notification::fake();
    [$tenant] = createTenantPanelTenant();
    $firstBranch = createTenantPanelBranch($tenant, 'Assigned');
    $secondBranch = createTenantPanelBranch($tenant, 'Other');
    $manager = createTenantPanelUser($tenant, 'branch-manager', $firstBranch);
    $product = createTenantPanelProduct($tenant);
    $variant = $product->variants()->create([
        'sku' => 'MANAGER-PANEL-SKU',
        'size' => 'M',
    ]);

    $this->actingAs($manager, 'web')
        ->put(route('tenant.stock.update'), [
            'stocks' => [[
                'branch_id' => $secondBranch->id,
                'variant_id' => $variant->id,
                'quantity' => 20,
            ]],
        ])
        ->assertForbidden();

    $this->put(route('tenant.stock.update'), [
        'stocks' => [[
            'branch_id' => $firstBranch->id,
            'variant_id' => $variant->id,
            'quantity' => 4,
        ]],
    ])->assertRedirect();

    $customer = Customer::create([
        'name' => 'Order Customer',
        'email' => 'order-customer@example.com',
        'password' => 'password',
    ]);
    $order = $customer->orders()->create([
        'order_no' => 'TENANT-PANEL-ORDER',
        'shipping_address' => ['city' => 'Dhaka'],
        'subtotal' => 500,
        'total' => 500,
        'payment_method' => 'cod',
    ]);
    $ownOrder = SubOrder::withoutGlobalScopes()->create([
        'order_id' => $order->id,
        'tenant_id' => $tenant->id,
        'branch_id' => $firstBranch->id,
        'total' => 500,
        'status' => 'pending',
    ]);
    $order->payments()->create([
        'method' => 'cod',
        'amount' => 500,
    ]);
    $otherOrder = SubOrder::withoutGlobalScopes()->create([
        'order_id' => $order->id,
        'tenant_id' => $tenant->id,
        'branch_id' => $secondBranch->id,
        'total' => 500,
        'status' => 'pending',
    ]);

    $this->get(route('tenant.orders.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Tenant/Orders/Index')
            ->has('orders.data', 1)
            ->where('orders.data.0.id', $ownOrder->id));

    $this->patch(route('tenant.orders.status', $otherOrder), [
        'status' => 'packed',
        'note' => 'Packed for delivery.',
    ])->assertForbidden();

    $this->patch(route('tenant.orders.status', $ownOrder), [
        'status' => 'confirmed',
        'note' => 'Order confirmed.',
    ])->assertRedirect();

    $this->patch(route('tenant.orders.payment-status', $ownOrder), [
        'status' => 'paid',
    ])->assertRedirect();

    $this->patch(route('tenant.orders.payment-status', $otherOrder), [
        'status' => 'paid',
    ])->assertForbidden();

    $this->patch(route('tenant.orders.shipping-fee-status', $ownOrder), [
        'status' => 'paid',
    ])->assertRedirect();

    $this->patch(route('tenant.orders.shipping-fee-status', $otherOrder), [
        'status' => 'paid',
    ])->assertForbidden();

    expect($ownOrder->fresh()->status)->toBe('confirmed')
        ->and($ownOrder->fresh()->shipping_fee_status)->toBe('paid')
        ->and($order->fresh()->payment_status)->toBe('paid')
        ->and($order->payments()->first()->status)->toBe('paid')
        ->and($ownOrder->trackings()->first()->note)->toBe('Order confirmed.')
        ->and(BranchStock::where('branch_id', $firstBranch->id)->where('variant_id', $variant->id)->value('quantity'))->toBe(4);
    Notification::assertSentTo($customer, CustomerOrderStatusChanged::class);
});

test('tenant dashboard exposes seven days of sales and low stock scoped to assigned branch', function () {
    [$tenant] = createTenantPanelTenant();
    $branch = createTenantPanelBranch($tenant);
    $otherBranch = createTenantPanelBranch($tenant, 'Secondary');
    $manager = createTenantPanelUser($tenant, 'branch-manager', $branch);
    $product = createTenantPanelProduct($tenant);
    $variant = $product->variants()->create(['sku' => 'DASHBOARD-LOW-1']);
    BranchStock::create(['branch_id' => $branch->id, 'variant_id' => $variant->id, 'quantity' => 2]);
    BranchStock::create(['branch_id' => $otherBranch->id, 'variant_id' => $variant->id, 'quantity' => 1]);

    $this->actingAs($manager, 'web')
        ->get(route('tenant.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Tenant/Dashboard')
            ->has('salesChart', 7)
            ->has('lowStock', 1)
            ->where('lowStock.0.branch.id', $branch->id)
            ->where('metrics.branches', 1));

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('tenantDashboard.metrics.sales')
            ->has('tenantDashboard.metrics.orders')
            ->has('tenantDashboard.salesChart', 7)
            ->has('tenantDashboard.lowStock', 1)
            ->where('tenantDashboard.lowStock.0.branch.id', $branch->id));
});

test('tenant dashboard filters sales by order type date range and admin-selected branch', function () {
    [$tenant] = createTenantPanelTenant();
    $firstBranch = createTenantPanelBranch($tenant, 'Dashboard First');
    $secondBranch = createTenantPanelBranch($tenant, 'Dashboard Second');
    $admin = createTenantPanelUser($tenant);
    $manager = createTenantPanelUser($tenant, 'branch-manager', $firstBranch);
    $customer = Customer::factory()->create();

    $createOrder = function (string $orderNo, Branch $branch, float $total, $createdAt) use ($customer, $tenant): SubOrder {
        $order = $customer->orders()->create([
            'order_no' => $orderNo,
            'shipping_address' => ['city' => 'Dhaka'],
            'subtotal' => $total,
            'total' => $total,
            'payment_method' => 'cod',
        ]);
        $order->created_at = $createdAt;
        $order->saveQuietly();

        return SubOrder::withoutGlobalScopes()->create([
            'order_id' => $order->id,
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
            'total' => $total,
            'status' => 'delivered',
        ]);
    };

    $todayPos = $createOrder('POS-DASHBOARD-TODAY', $firstBranch, 100, now());
    $createOrder('ONLINE-DASHBOARD-TODAY', $secondBranch, 200, now());
    $createOrder('POS-DASHBOARD-YESTERDAY', $firstBranch, 300, now()->subDay());

    $this->actingAs($admin, 'web')
        ->get(route('tenant.dashboard', [
            'order_type' => 'pos',
            'date_preset' => 'today',
            'branch_id' => $firstBranch->id,
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Tenant/Dashboard')
            ->where('metrics.sales', 100)
            ->where('metrics.orders', 1)
            ->where('metrics.branches', 1)
            ->where('filters.branch_id', (string) $firstBranch->id)
            ->where('filters.order_type', 'pos')
            ->where('salesChart.0.sales', 100)
            ->where('salesChart.0.orders', 1)
            ->where('canFilterBranches', true));

    $this->get(route('tenant.dashboard', [
        'order_type' => 'online',
        'date_preset' => 'today',
        'branch_id' => $secondBranch->id,
    ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('metrics.sales', 200)
            ->where('metrics.orders', 1));

    $yesterday = today()->subDay()->toDateString();
    $this->get(route('tenant.dashboard', [
        'order_type' => 'pos',
        'date_preset' => 'custom',
        'date_from' => $yesterday,
        'date_to' => $yesterday,
        'branch_id' => $firstBranch->id,
    ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('metrics.sales', 300)
            ->where('metrics.orders', 1)
            ->has('salesChart', 1)
            ->where('salesChart.0.date', $yesterday));

    $this->get(route('tenant.dashboard', ['branch_id' => 999999]))
        ->assertNotFound();

    $this->actingAs($manager, 'web')
        ->get(route('tenant.dashboard', ['branch_id' => $secondBranch->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('metrics.sales', 400)
            ->where('metrics.orders', 2)
            ->where('filters.branch_id', (string) $firstBranch->id)
            ->where('canFilterBranches', false));

    expect($todayPos->exists)->toBeTrue();
});

test('tenant orders can be filtered by POS or online type and order date', function () {
    [$tenant] = createTenantPanelTenant();
    $branch = createTenantPanelBranch($tenant);
    $admin = createTenantPanelUser($tenant);
    $customer = Customer::create([
        'name' => 'Order Filter Customer',
        'email' => 'order-filter-customer@example.com',
        'password' => 'password',
    ]);

    $createOrder = function (string $orderNo, $createdAt) use ($customer, $tenant, $branch): SubOrder {
        $order = $customer->orders()->create([
            'order_no' => $orderNo,
            'shipping_address' => ['city' => 'Dhaka'],
            'subtotal' => 100,
            'total' => 100,
            'payment_method' => 'cod',
        ]);
        $order->created_at = $createdAt;
        $order->saveQuietly();

        return SubOrder::withoutGlobalScopes()->create([
            'order_id' => $order->id,
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
            'total' => 100,
            'status' => 'delivered',
        ]);
    };

    $createOrder('POS-TODAY-001', now());
    $todayOnline = $createOrder('ONLINE-TODAY-001', now());
    $yesterdayPos = $createOrder('POS-YESTERDAY-001', now()->subDay());

    $this->actingAs($admin, 'web')
        ->get(route('tenant.orders.index', ['order_type' => 'pos']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('orders.data', 2)
            ->where('filters.order_type', 'pos')
        );

    $this->get(route('tenant.orders.index', ['order_type' => 'online']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('orders.data', 1)
            ->where('orders.data.0.id', $todayOnline->id)
            ->where('filters.order_type', 'online')
        );

    $this->get(route('tenant.orders.index', ['date_preset' => 'today']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('orders.data', 2)
            ->where('filters.date_preset', 'today')
        );

    $yesterday = today()->subDay()->toDateString();
    $this->get(route('tenant.orders.index', [
        'date_preset' => 'custom',
        'date_from' => $yesterday,
        'date_to' => $yesterday,
    ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('orders.data', 1)
            ->where('orders.data.0.id', $yesterdayPos->id)
            ->where('filters.date_from', $yesterday)
        );
});

test('tenant admins can export filtered orders as excel and pdf', function () {
    [$tenant] = createTenantPanelTenant();
    [$otherTenant] = createTenantPanelTenant();
    $admin = createTenantPanelUser($tenant);
    $branch = createTenantPanelBranch($tenant, 'Export Main');
    $otherBranch = createTenantPanelBranch($otherTenant, 'Export Other');
    $customer = Customer::factory()->create();

    $paidOrder = $customer->orders()->create([
        'order_no' => 'PAID-'.strtoupper(uniqid()),
        'shipping_address' => ['city' => 'Dhaka'],
        'subtotal' => 100,
        'total' => 100,
        'payment_method' => 'cod',
        'payment_status' => 'paid',
    ]);
    $paidSubOrder = $paidOrder->subOrders()->create([
        'tenant_id' => $tenant->id,
        'branch_id' => $branch->id,
        'total' => 100,
        'status' => 'delivered',
        'shipping_fee_status' => 'paid',
    ]);

    $unpaidOrder = $customer->orders()->create([
        'order_no' => 'UNPAID-'.strtoupper(uniqid()),
        'shipping_address' => ['city' => 'Dhaka'],
        'subtotal' => 50,
        'total' => 50,
        'payment_method' => 'cod',
        'payment_status' => 'pending',
    ]);
    $unpaidOrder->subOrders()->create([
        'tenant_id' => $tenant->id,
        'branch_id' => $branch->id,
        'total' => 50,
        'status' => 'pending',
        'shipping_fee_status' => 'pending',
    ]);

    $foreignOrder = $customer->orders()->create([
        'order_no' => 'FOREIGN-'.strtoupper(uniqid()),
        'shipping_address' => ['city' => 'Dhaka'],
        'subtotal' => 200,
        'total' => 200,
        'payment_method' => 'cod',
        'payment_status' => 'paid',
    ]);
    $foreignOrder->subOrders()->create([
        'tenant_id' => $otherTenant->id,
        'branch_id' => $otherBranch->id,
        'total' => 200,
        'status' => 'pending',
    ]);

    $response = $this->actingAs($admin, 'web')
        ->get(route('tenant.orders.export', ['format' => 'xlsx']))
        ->assertOk();

    expect($response->headers->get('Content-Type'))
        ->toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    $tempPath = sys_get_temp_dir().'/orders-export-'.uniqid().'.xlsx';
    file_put_contents($tempPath, $response->getContent());

    try {
        $zip = new ZipArchive;
        $zip->open($tempPath);
        $sheet = strval($zip->getFromName('xl/worksheets/sheet1.xml'));
        $zip->close();

        expect($sheet)
            ->toContain('Order no')
            ->toContain($paidOrder->order_no)
            ->toContain($unpaidOrder->order_no)
            ->toContain('Total orders: 2')
            ->not->toContain($foreignOrder->order_no)
            ->not->toContain('FOREIGN-');
    } finally {
        @unlink($tempPath);
    }

    $filtered = $this->actingAs($admin, 'web')
        ->get(route('tenant.orders.export', ['format' => 'xlsx', 'payment_status' => 'paid']))
        ->assertOk();

    $tempPath = sys_get_temp_dir().'/orders-filtered-'.uniqid().'.xlsx';
    file_put_contents($tempPath, $filtered->getContent());

    try {
        $zip = new ZipArchive;
        $zip->open($tempPath);
        $sheet = strval($zip->getFromName('xl/worksheets/sheet1.xml'));
        $zip->close();

        expect($sheet)
            ->toContain($paidOrder->order_no)
            ->not->toContain($unpaidOrder->order_no);
    } finally {
        @unlink($tempPath);
    }

    $pdf = $this->actingAs($admin, 'web')
        ->get(route('tenant.orders.export', ['format' => 'pdf', 'payment_status' => 'paid']))
        ->assertOk();

    expect($pdf->headers->get('Content-Type'))
        ->toBe('application/pdf')
        ->and(str_starts_with(strval($pdf->getContent()), '%PDF-'))->toBeTrue();
});

test('orders export is forbidden without tenant membership and available in read-only mode', function () {
    [$tenant] = createTenantPanelTenant();
    $user = User::factory()->create();

    $this->actingAs($user, 'web')
        ->get(route('tenant.orders.export'))
        ->assertForbidden();

    $member = createTenantPanelUser($tenant);
    $tenant->subscriptions()->update(['status' => 'expired']);

    $this->actingAs($member, 'web')
        ->get(route('tenant.orders.export'))
        ->assertOk();
});

test('tenant members can download an order invoice pdf and foreign tenants cannot', function () {
    [$tenant] = createTenantPanelTenant();
    [$otherTenant] = createTenantPanelTenant();
    $admin = createTenantPanelUser($tenant);
    $foreignUser = createTenantPanelUser($otherTenant);
    $branch = createTenantPanelBranch($tenant);
    $product = createTenantPanelProduct($tenant, 'invoice-product');
    $variant = $product->variants()->create(['sku' => 'INVOICE-'.uniqid(), 'size' => 'XL', 'price' => 1450]);
    $customer = Customer::factory()->create();

    $order = $customer->orders()->create([
        'order_no' => 'INVOICE-'.strtoupper(uniqid()),
        'shipping_address' => [
            'address_line' => '12 Example Road',
            'division' => 'Dhaka',
            'district' => 'Dhaka',
            'upazila' => 'Dhanmondi',
            'postal_code' => '1209',
            'phone' => '+8801800000000',
        ],
        'subtotal' => 2900,
        'shipping_fee' => 60,
        'total' => 2960,
        'payment_method' => 'cod',
        'payment_status' => 'paid',
    ]);
    $subOrder = $order->subOrders()->create([
        'tenant_id' => $tenant->id,
        'branch_id' => $branch->id,
        'total' => 2900,
        'status' => 'shipped',
        'shipping_fee_status' => 'paid',
    ]);
    $subOrder->items()->create([
        'product_id' => $product->id,
        'variant_id' => $variant->id,
        'name' => 'Cotton Polo Shirt - XL',
        'price' => 1450,
        'quantity' => 2,
    ]);

    $response = $this->actingAs($admin, 'web')
        ->get(route('tenant.orders.invoice', $subOrder))
        ->assertOk();

    expect($response->headers->get('Content-Type'))->toBe('application/pdf')
        ->and(str_starts_with(strval($response->getContent()), '%PDF-'))->toBeTrue()
        ->and($response->headers->get('Content-Disposition'))->toContain('invoice-')
        ->and($response->getContent())->toContain('(12 Example Road, Dhaka, Dhaka,)')
        ->and($response->getContent())->toContain('(Dhanmondi, 1209)')
        ->and($response->getContent())->toContain('(Tk 2,900.00)')
        ->and($response->getContent())->not->toContain('à§³');

    $this->actingAs($foreignUser, 'web')
        ->get(route('tenant.orders.invoice', $subOrder))
        ->assertNotFound();
});
