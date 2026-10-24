<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Customer;
use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use InvalidArgumentException;

class CustomerOrderPlaced extends Notification
{
    use Queueable;

    public function __construct(public readonly Order $order) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        if (! $notifiable instanceof Customer) {
            throw new InvalidArgumentException('Order notifications can only be sent to customers.');
        }

        return (new MailMessage)
            ->subject("Order {$this->order->order_no} confirmed")
            ->greeting("Hello {$notifiable->name},")
            ->line("We’ve received your order {$this->order->order_no}.")
            ->line('Order total: ৳'.number_format((float) $this->order->total, 2))
            ->line('We’ll send you updates as your order is prepared.');
    }

    /**
     * @return array<string, int|string>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'order_id' => $this->order->id,
            'order_no' => $this->order->order_no,
            'status' => 'placed',
            'total' => (string) $this->order->total,
        ];
    }
}
