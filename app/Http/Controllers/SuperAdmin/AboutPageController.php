<?php

declare(strict_types=1);

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\UpdateAboutPageRequest;
use App\Models\AboutPage;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AboutPageController extends Controller
{
    public function edit(): Response
    {
        $about = AboutPage::current();

        return Inertia::render('SuperAdmin/About/Edit', [
            'about' => $about->only([
                'eyebrow',
                'title',
                'intro',
                'story_heading',
                'story_body',
                'mission_heading',
                'mission_body',
                'vision_heading',
                'vision_body',
                'values',
            ]),
        ]);
    }

    public function update(UpdateAboutPageRequest $request): RedirectResponse
    {
        $about = AboutPage::current();
        $about->update($request->validated());

        activity('super-admin')
            ->causedBy($request->user())
            ->performedOn($about)
            ->log('Updated marketplace about page');

        return back()->with('success', 'About page updated.');
    }
}
