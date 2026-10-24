<?php

namespace App\Notifications;

use App\Models\SubOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CustomerOrderStatusChanged extends Notification
{
    use Queueable;

    public function __construct(
        public readonly SubOrder $subOrder,
        public readonly ?string $note = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your order status has been updated')
            ->greeting("Hello {$notifiable->name},")
            ->line("Your order {$this->subOrder->order->order_no} is now {$this->subOrder->status}.")
            ->when($this->note !== null, fn (MailMessage $mail) => $mail->line($this->note))
            ->line('Thank you for shopping with us.');
    }

    /**
     * @return array<string, int|string|null>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'order_no' => $this->subOrder->order->order_no,
            'sub_order_id' => $this->subOrder->id,
            'status' => $this->subOrder->status,
            'note' => $this->note,
        ];
    }
}
