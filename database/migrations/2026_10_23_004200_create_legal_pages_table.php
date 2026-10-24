<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('legal_pages', function (Blueprint $table): void {
            $table->id();
            $table->string('slug', 60)->unique();
            $table->string('title', 160);
            $table->text('intro');
            $table->longText('content');
            $table->timestamps();
        });

        $now = now();
        DB::table('legal_pages')->insert([
            [
                'slug' => 'terms-of-use',
                'title' => 'Terms of Use',
                'intro' => 'Please review these terms before using our marketplace.',
                'content' => "Using the marketplace\nBy accessing or using this marketplace, you agree to follow these terms and all applicable laws. If you do not agree, please do not use the service.\n\nMarketplace accounts\nYou are responsible for providing accurate account information and keeping your sign-in details secure. Please notify us if you believe your account has been accessed without permission.\n\nOrders and sellers\nProducts are offered by participating stores. Product details, availability, pricing, delivery estimates, and order updates are provided for your shopping convenience and may change. An order may be subject to confirmation by the relevant seller.\n\nAcceptable use\nDo not misuse the marketplace, interfere with its operation, submit misleading information, or use it in a way that violates another person’s rights or applicable law.\n\nUpdates and contact\nWe may update these terms as the marketplace changes. The current version will be published on this page. Contact our team if you have questions about these terms.",
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'privacy-policy',
                'title' => 'Privacy Policy',
                'intro' => 'This page explains how marketplace information is handled.',
                'content' => "Information you provide\nWe collect information you submit when creating an account, placing an order, contacting support, or using other marketplace features. This may include contact, delivery, and order details.\n\nHow information is used\nInformation is used to operate the marketplace, process and communicate about orders, provide customer support, protect accounts, and improve the service.\n\nSharing information\nInformation needed to fulfil an order may be shared with the relevant store and delivery providers. We do not publish your private account information. Information may also be disclosed when required by law or necessary to protect the marketplace and its users.\n\nSecurity and retention\nWe use appropriate measures to protect information. Information is retained for as long as needed for the purposes described here, including legal, accounting, and operational requirements.\n\nYour choices and contact\nYou may update account details through your account or contact us with privacy questions. This policy may be updated from time to time; the latest version will be shown here.",
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'refund-policy',
                'title' => 'Refund Policy',
                'intro' => 'Learn how return and refund requests are handled for marketplace orders.',
                'content' => "Requesting help\nIf an order arrives damaged, incomplete, incorrect, or otherwise differs from what you ordered, contact our support team with your order details as soon as possible.\n\nReview of requests\nRequests are reviewed with the relevant store and may require order information, photographs, or return of the item. The available resolution depends on the item, order status, and applicable consumer protection requirements.\n\nRefund processing\nWhen a refund is approved, the amount and processing method will be communicated to you. Processing time may depend on the original payment method and the parties involved in the order.\n\nItems that cannot be returned\nSome items may not be eligible for return because of their nature, condition, or applicable rules. Any relevant restrictions should be provided with the product or at checkout.\n\nNeed assistance?\nContact our team with your order number and a description of the issue. We will help direct your request to the appropriate seller or support channel.",
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        $settings = DB::table('market_settings')->where('id', 1)->first(['footer_content']);
        if ($settings?->footer_content) {
            $footerContent = json_decode($settings->footer_content, true, flags: JSON_THROW_ON_ERROR);
            $aboutLinks = $footerContent['about_links'] ?? [
                ['label' => 'About us', 'url' => '/about'],
                ['label' => 'Contact', 'url' => '/contact'],
                ['label' => 'Frequently asked questions', 'url' => '/faq'],
            ];
            $legalLinks = [
                ['label' => 'Terms of Use', 'url' => '/terms-of-use'],
                ['label' => 'Privacy Policy', 'url' => '/privacy-policy'],
                ['label' => 'Refund Policy', 'url' => '/refund-policy'],
            ];

            foreach ($legalLinks as $legalLink) {
                if (! collect($aboutLinks)->contains('url', $legalLink['url'])) {
                    $aboutLinks[] = $legalLink;
                }
            }

            $footerContent['about_links'] = $aboutLinks;
            DB::table('market_settings')->where('id', 1)->update([
                'footer_content' => json_encode($footerContent, JSON_THROW_ON_ERROR),
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('legal_pages');
    }
};
