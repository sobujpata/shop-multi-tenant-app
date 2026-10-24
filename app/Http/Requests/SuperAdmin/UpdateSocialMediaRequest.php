<?php

declare(strict_types=1);

namespace App\Http\Requests\SuperAdmin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSocialMediaRequest extends FormRequest
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
            'social_links' => ['present', 'array', 'max:10'],
            'social_links.*.platform' => ['required', 'distinct', 'in:facebook,instagram,youtube,x,linkedin,tiktok'],
            'social_links.*.url' => ['required', 'url:http,https', 'max:2048'],
        ];
    }
}
