<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'avatar',
        'gender',
        'date_of_birth',
        'bio',
        'preferred_language',
        'newsletter_opt_in',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'newsletter_opt_in' => 'boolean',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
