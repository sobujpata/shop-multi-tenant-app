<?php

namespace App\Http\Requests\SuperAdmin;

use Illuminate\Foundation\Http\FormRequest;

class SaveDivisionToUnionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'divisions' => ['required', 'string', 'max:255'],
            'districts' => ['required', 'string', 'max:255'],
            'upazilas' => ['required', 'string', 'max:255'],
            'unions' => ['nullable', 'string', 'max:255'],
            'postoffices' => ['nullable', 'string', 'max:255'],
            'postcodes' => ['nullable', 'string', 'max:255'],
        ];
    }
}
