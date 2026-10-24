<?php

declare(strict_types=1);

namespace App\Http\Requests\SuperAdmin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLegalPagesRequest extends FormRequest
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
            'pages' => [
                'required',
                'array:terms-of-use,privacy-policy,refund-policy',
                'size:3',
            ],
            'pages.terms-of-use.title' => ['required', 'string', 'max:160'],
            'pages.terms-of-use.intro' => ['required', 'string', 'max:1000'],
            'pages.terms-of-use.content' => ['required', 'string', 'max:30000'],
            'pages.privacy-policy.title' => ['required', 'string', 'max:160'],
            'pages.privacy-policy.intro' => ['required', 'string', 'max:1000'],
            'pages.privacy-policy.content' => ['required', 'string', 'max:30000'],
            'pages.refund-policy.title' => ['required', 'string', 'max:160'],
            'pages.refund-policy.intro' => ['required', 'string', 'max:1000'],
            'pages.refund-policy.content' => ['required', 'string', 'max:30000'],
        ];
    }
}
