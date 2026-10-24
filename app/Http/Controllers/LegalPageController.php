<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\LegalPage;
use Inertia\Inertia;
use Inertia\Response;

class LegalPageController extends Controller
{
    public function __invoke(string $slug): Response
    {
        $page = LegalPage::query()->where('slug', $slug)->firstOrFail();

        return Inertia::render('Legal/Show', [
            'legalPage' => $page->only(['slug', 'title', 'intro', 'content']),
        ]);
    }
}
