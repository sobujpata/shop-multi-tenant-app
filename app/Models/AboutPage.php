<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AboutPage extends Model
{
    protected $fillable = [
        'eyebrow',
        'title',
        'intro',
        'story_heading',
        'story_body',
        'mission_heading',
        'mission_body',
        'vision_heading',
        'vision_body',
        'values',
    ];

    protected function casts(): array
    {
        return [
            'values' => 'array',
        ];
    }

    public static function current(): self
    {
        return self::query()->firstOrCreate(
            ['id' => 1],
            [
                'eyebrow' => 'Our marketplace',
                'title' => 'A little something for every part of life.',
                'intro' => 'We bring shoppers and independent stores together in one trusted marketplace, making it easier to discover great products from sellers across Bangladesh.',
                'story_heading' => 'Shopping that brings us closer',
                'story_body' => 'Our marketplace was created to help local businesses reach more people and give shoppers a simple way to find the things they need.',
                'mission_heading' => 'Our mission',
                'mission_body' => 'Make online shopping more welcoming and dependable for customers and independent sellers.',
                'vision_heading' => 'Our vision',
                'vision_body' => 'Build a thriving digital marketplace where independent businesses can grow.',
                'values' => [],
            ],
        );
    }
}
