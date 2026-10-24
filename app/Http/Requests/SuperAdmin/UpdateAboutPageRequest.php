<?php

declare(strict_types=1);

namespace App\Http\Requests\SuperAdmin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAboutPageRequest extends FormRequest
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
            'story_heading' => ['required', 'string', 'max:160'],
            'story_body' => ['required', 'string', 'max:10000'],
            'mission_heading' => ['required', 'string', 'max:120'],
            'mission_body' => ['required', 'string', 'max:2000'],
            'vision_heading' => ['required', 'string', 'max:120'],
            'vision_body' => ['required', 'string', 'max:2000'],
            'values' => ['present', 'array', 'max:6'],
            'values.*.title' => ['required', 'string', 'max:80'],
            'values.*.description' => ['required', 'string', 'max:300'],
        ];
    }
}
