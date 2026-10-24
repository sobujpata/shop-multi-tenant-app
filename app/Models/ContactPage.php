<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactPage extends Model
{
    protected $fillable = [
        'eyebrow',
        'title',
        'intro',
        'email',
        'phone',
        'whatsapp',
        'address',
        'business_hours',
        'map_url',
    ];

    public static function current(): self
    {
        return self::query()->firstOrCreate(
            ['id' => 1],
            [
                'eyebrow' => 'We are here to help',
                'title' => 'Get in touch',
                'intro' => 'Have a question about shopping, selling, or your order? Reach out to our marketplace team.',
                'email' => null,
                'phone' => null,
                'whatsapp' => null,
                'address' => null,
                'business_hours' => null,
                'map_url' => null,
            ],
        );
    }
}
