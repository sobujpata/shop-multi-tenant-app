<?php

declare(strict_types=1);

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\UpdateLegalPagesRequest;
use App\Models\LegalPage;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class LegalPagesController extends Controller
{
    private const PAGE_SLUGS = [
        'terms-of-use',
        'privacy-policy',
        'refund-policy',
    ];

    public function edit(): Response
    {
        return Inertia::render('SuperAdmin/LegalPages/Edit', [
            'pages' => LegalPage::query()
                ->whereIn('slug', self::PAGE_SLUGS)
                ->get(['slug', 'title', 'intro', 'content'])
                ->keyBy('slug'),
        ]);
    }

    public function update(UpdateLegalPagesRequest $request): RedirectResponse
    {
        $pages = $request->validated('pages');

        foreach (self::PAGE_SLUGS as $slug) {
            LegalPage::query()
                ->where('slug', $slug)
                ->update($pages[$slug]);
        }

        activity('super-admin')
            ->causedBy($request->user())
            ->log('Updated marketplace legal pages');

        return back()->with('success', 'Legal pages updated.');
    }
}
