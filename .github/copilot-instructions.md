# Project context
Multi-tenant, multi-branch e-commerce marketplace (clothing, electronics, men fashion, women fashion, children fashion, cosmetics, etc.).
Stack: Laravel 13, Inertia.js, React 18, Tailwind CSS (darkMode: 'class'), MySQL, lucide-react.

## Architecture rules
- Single database. Tenant-owned tables have a tenant_id column.
- Staff table: users (roles via spatie/laravel-permission: super-admin, tenant-admin, branch-manager). Guard: web.
- Shopper table: customers (auth only) + customer_profiles (1:1 personal details) + customer_addresses (1:many). Guard: customer. Never put customers in the users table.
- One checkout creates 1 order, split into sub_orders (one per tenant + branch).
- Public shop queries must use withoutGlobalScopes(). Tenant panel queries use the BelongsToTenant trait.
- Stock lives in branch_stocks (per branch per variant).
- Use Form Request classes, API Resources/Inertia props, service classes for business logic, DB transactions for checkout.
- Use Laravel's built-in features (e.g., policies, gates, notifications, events, jobs, queues) instead of custom implementations.
- url: https://your-project-url.com/customer/login and https://your-project-url.com/customer/register will be customer login/registration pages, https://your-project-url.com/staff/login will be staff login page. Use separate guards for customers and staff.

## Code style
- PSR-12, strict types, typed properties and return types.
- React: functional components, hooks, Tailwind only, every component supports light and dark (dark: classes).
- Currency: ৳ (BDT). Keep controllers thin.