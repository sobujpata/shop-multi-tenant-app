<?php

declare(strict_types=1);

namespace App\Http\Requests\SuperAdmin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMarketSettingsRequest extends FormRequest
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
            'market_name' => ['required', 'string', 'max:120'],
            'logo' => ['nullable', 'image', 'max:2048'],
            'remove_logo' => ['sometimes', 'boolean'],
            'currency_code' => ['required', 'in:BDT,USD,EUR,GBP,INR,PKR,AED,JPY'],
            'timezone' => ['required', 'timezone'],
            'social_links' => ['sometimes', 'array', 'max:10'],
            'social_links.*.platform' => ['required', 'distinct', 'in:facebook,instagram,youtube,x,linkedin,tiktok'],
            'social_links.*.url' => ['required', 'url:http,https', 'max:2048'],
        ];
    }
}
