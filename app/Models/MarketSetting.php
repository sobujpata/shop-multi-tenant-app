<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MarketSetting extends Model
{
    protected $fillable = [
        'market_name',
        'logo_path',
        'currency_code',
        'timezone',
        'social_links',
        'footer_content',
    ];

    protected function casts(): array
    {
        return [
            'social_links' => 'array',
            'footer_content' => 'array',
        ];
    }

    public static function current(): self
    {
        return self::query()->firstOrCreate(
            ['id' => 1],
            [
                'market_name' => config('app.name', 'Marketplace'),
                'currency_code' => 'BDT',
                'timezone' => config('app.timezone', 'Asia/Dhaka'),
            ],
        );
    }

    /**
     * @return array{
     *     description: string,
     *     explore_links: array<int, array{label: string, url: string}>,
     *     about_heading: string,
     *     about_links: array<int, array{label: string, url: string}>,
     *     cta_title: string,
     *     cta_description: string,
     *     cta_label: string,
     *     cta_url: string,
     *     tagline: string
     * }
     */
    public static function defaultFooterContent(): array
    {
        return [
            'description' => 'A little something for every part of life. Discover considered finds from independent stores near you.',
            'explore_links' => [
                ['label' => 'Shop all', 'url' => '/shop'],
                ['label' => 'New arrivals', 'url' => '/shop?sort=newest'],
                ['label' => 'My account', 'url' => '/customer/account/profile'],
            ],
            'about_heading' => 'About',
            'about_links' => [
                ['label' => 'About us', 'url' => '/about'],
                ['label' => 'Contact', 'url' => '/contact'],
                ['label' => 'Frequently asked questions', 'url' => '/faq'],
                ['label' => 'Terms of Use', 'url' => '/terms-of-use'],
                ['label' => 'Privacy Policy', 'url' => '/privacy-policy'],
                ['label' => 'Refund Policy', 'url' => '/refund-policy'],
            ],
            'cta_title' => 'A better way to discover',
            'cta_description' => 'Shop unique collections from neighborhood stores, all in one place.',
            'cta_label' => 'Find your next favorite',
            'cta_url' => '/shop',
            'tagline' => 'Thoughtfully selected, locally delivered.',
        ];
    }
}
