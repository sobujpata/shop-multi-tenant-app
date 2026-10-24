<?php

declare(strict_types=1);

namespace App\Http\Requests\SuperAdmin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateContactPageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('super-admin') ?? false;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'eyebrow' => ['required', 'string', 'max:100'],
            'title' => ['required', 'string', 'max:160'],
            'intro' => ['required', 'string', 'max:1000'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'whatsapp' => ['nullable', 'string', 'max:40'],
            'address' => ['nullable', 'string', 'max:2000'],
            'business_hours' => ['nullable', 'string', 'max:1000'],
            'map_url' => ['nullable', 'url', 'max:2048', 'starts_with:https://'],
        ];
    }
}
