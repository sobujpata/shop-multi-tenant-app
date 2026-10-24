<?php

namespace App\Models;

use Database\Factories\ProductVariantFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductVariant extends Model
{
    /** @use HasFactory<ProductVariantFactory> */
    use HasFactory;

    /**
     * Scanner-friendly barcode alphabet: digits and uppercase letters without
     * the easy-to-confuse 0/O, 1/I and L pairs (CODE 39 reads them as one).
     */
    private const BARCODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

    protected $fillable = [
        'product_id',
        'sku',
        'barcode_code',
        'size',
        'color',
        'price',
    ];

    protected static function booted(): void
    {
        self::creating(function (self $variant): void {
            if ($variant->barcode_code === null) {
                $variant->barcode_code = self::generateBarcodeCode();
            }
        });
    }

    /**
     * A unique 5-character alphanumeric code for the variant barcode label.
     */
    public static function generateBarcodeCode(): string
    {
        do {
            $code = substr(str_shuffle(self::BARCODE_ALPHABET), 0, 5);
        } while (self::query()->where('barcode_code', $code)->exists());

        return $code;
    }

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return HasMany<BranchStock, $this>
     */
    public function stocks(): HasMany
    {
        return $this->hasMany(BranchStock::class, 'variant_id');
    }

    /**
     * @return HasMany<CartItem, $this>
     */
    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class, 'variant_id');
    }

    /**
     * @return HasMany<OrderItem, $this>
     */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class, 'variant_id');
    }
}
