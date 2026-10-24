<?php

declare(strict_types=1);

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\UpdateFooterContentRequest;
use App\Models\MarketSetting;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class FooterContentController extends Controller
{
    public function edit(): Response
    {
        $settings = MarketSetting::current();

        return Inertia::render('SuperAdmin/FooterContent/Edit', [
            'footerContent' => array_replace(
                MarketSetting::defaultFooterContent(),
                $settings->footer_content ?? [],
            ),
        ]);
    }

    public function update(UpdateFooterContentRequest $request): RedirectResponse
    {
        $settings = MarketSetting::current();
        $settings->update([
            'footer_content' => $request->validated(),
        ]);

        activity('super-admin')
            ->causedBy($request->user())
            ->performedOn($settings)
            ->log('Updated marketplace footer content');

        return back()->with('success', 'Footer content updated.');
    }
}
