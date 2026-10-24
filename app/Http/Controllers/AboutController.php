<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\AboutPage;
use Inertia\Inertia;
use Inertia\Response;

class AboutController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('About', [
            'about' => AboutPage::current()->only([
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
}
