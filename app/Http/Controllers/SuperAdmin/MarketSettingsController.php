<?php

declare(strict_types=1);

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\UpdateMarketSettingsRequest;
use App\Models\MarketSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MarketSettingsController extends Controller
{
    private const array CURRENCIES = [
        'BDT' => 'Bangladeshi taka (BDT)',
        'USD' => 'US dollar (USD)',
        'EUR' => 'Euro (EUR)',
        'GBP' => 'Pound sterling (GBP)',
        'INR' => 'Indian rupee (INR)',
        'PKR' => 'Pakistani rupee (PKR)',
        'AED' => 'UAE dirham (AED)',
        'JPY' => 'Japanese yen (JPY)',
    ];

    public function edit(): Response
    {
        $settings = MarketSetting::current();

        return Inertia::render('SuperAdmin/MarketSettings/Edit', [
            'settings' => [
                'market_name' => $settings->market_name,
                'logo_url' => $settings->logo_path
                    ? Storage::disk('public')->url($settings->logo_path)
                    : null,
                'currency_code' => $settings->currency_code,
                'timezone' => $settings->timezone,
                'social_links' => $settings->social_links ?? [],
            ],
            'currencies' => self::CURRENCIES,
            'timezones' => timezone_identifiers_list(),
        ]);
    }

    public function update(UpdateMarketSettingsRequest $request): RedirectResponse
    {
        $settings = MarketSetting::current();
        $data = $request->validated();
        $oldLogo = $settings->logo_path;
        $removeLogo = filter_var($data['remove_logo'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if ($request->hasFile('logo')) {
            $data['logo_path'] = $request->file('logo')->store('market', 'public');
        } elseif ($removeLogo) {
            $data['logo_path'] = null;
        }

        unset($data['logo'], $data['remove_logo']);
        $settings->update($data);

        if ($oldLogo && $oldLogo !== $settings->logo_path) {
            Storage::disk('public')->delete($oldLogo);
        }

        activity('super-admin')
            ->causedBy($request->user())
            ->performedOn($settings)
            ->log('Updated marketplace settings');

        return back()->with('success', 'Market settings updated.');
    }
}
