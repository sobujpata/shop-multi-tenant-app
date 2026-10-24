<?php

declare(strict_types=1);

namespace App\Http\Requests\SuperAdmin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFooterContentRequest extends FormRequest
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
            'description' => ['required', 'string', 'max:500'],
            'explore_links' => ['present', 'array', 'max:8'],
            'explore_links.*.label' => ['required', 'string', 'max:60'],
            'explore_links.*.url' => [
                'required',
                'string',
                'max:2048',
                'regex:/^(https?:\/\/|\/(?!\/))/i',
            ],
            'about_heading' => ['required', 'string', 'max:100'],
            'about_links' => ['present', 'array', 'max:8'],
            'about_links.*.label' => ['required', 'string', 'max:60'],
            'about_links.*.url' => [
                'required',
                'string',
                'max:2048',
                'regex:/^(https?:\/\/|\/(?!\/))/i',
            ],
            'cta_title' => ['required', 'string', 'max:100'],
            'cta_description' => ['required', 'string', 'max:300'],
            'cta_label' => ['required', 'string', 'max:60'],
            'cta_url' => [
                'required',
                'string',
                'max:2048',
                'regex:/^(https?:\/\/|\/(?!\/))/i',
            ],
            'tagline' => ['required', 'string', 'max:180'],
        ];
    }
}
