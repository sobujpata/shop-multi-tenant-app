<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\ContactPage;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Contact', [
            'contact' => ContactPage::current()->only([
                'eyebrow',
                'title',
                'intro',
                'email',
                'phone',
                'whatsapp',
                'address',
                'business_hours',
                'map_url',
            ]),
        ]);
    }
}
