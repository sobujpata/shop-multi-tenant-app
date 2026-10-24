<?php

declare(strict_types=1);

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\UpdateContactPageRequest;
use App\Models\ContactPage;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ContactPageController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('SuperAdmin/Contact/Edit', [
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

    public function update(UpdateContactPageRequest $request): RedirectResponse
    {
        $contact = ContactPage::current();
        $contact->update($request->validated());

        activity('super-admin')
            ->causedBy($request->user())
            ->performedOn($contact)
            ->log('Updated marketplace contact information');

        return back()->with('success', 'Contact information updated.');
    }
}
