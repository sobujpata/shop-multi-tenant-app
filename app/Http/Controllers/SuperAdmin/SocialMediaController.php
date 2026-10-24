<?php

declare(strict_types=1);

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\UpdateSocialMediaRequest;
use App\Models\MarketSetting;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SocialMediaController extends Controller
{
    private const array PLATFORMS = [
        'facebook' => 'Facebook',
        'instagram' => 'Instagram',
        'youtube' => 'YouTube',
        'x' => 'X',
        'linkedin' => 'LinkedIn',
        'tiktok' => 'TikTok',
    ];

    public function edit(): Response
    {
        $settings = MarketSetting::current();

        return Inertia::render('SuperAdmin/SocialMedia/Edit', [
            'socialLinks' => $settings->social_links ?? [],
            'platforms' => self::PLATFORMS,
        ]);
    }

    public function update(UpdateSocialMediaRequest $request): RedirectResponse
    {
        $settings = MarketSetting::current();
        $settings->update([
            'social_links' => array_values($request->validated('social_links')),
        ]);

        activity('super-admin')
            ->causedBy($request->user())
            ->performedOn($settings)
            ->log('Updated marketplace social links');

        return back()->with('success', 'Social media links updated.');
    }
}
