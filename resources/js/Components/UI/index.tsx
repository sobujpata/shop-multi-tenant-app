import { Badge as BaseBadge } from '@/components/ui/badge';
import { Button as BaseButton } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import {
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input as BaseInput } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ComponentProps, PropsWithChildren, ReactNode } from 'react';

export type ButtonProps = ComponentProps<typeof BaseButton>;

export function Button(props: ButtonProps) {
    return <BaseButton {...props} />;
}

export type InputProps = ComponentProps<typeof BaseInput>;

export function Input({ className, ...props }: InputProps) {
    return (
        <BaseInput {...props} className={cn('rounded-control', className)} />
    );
}

export type BadgeProps = ComponentProps<typeof BaseBadge>;

export function Badge(props: BadgeProps) {
    return <BaseBadge {...props} />;
}

export function Modal({
    open,
    onOpenChange,
    title,
    description,
    children,
    footer,
    className,
}: PropsWithChildren<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    footer?: ReactNode;
    className?: string;
}>) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn('rounded-dialog', className)}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && (
                        <DialogDescription>{description}</DialogDescription>
                    )}
                </DialogHeader>
                {children}
                {footer && <DialogFooter>{footer}</DialogFooter>}
            </DialogContent>
        </Dialog>
    );
}

export function Table({ className, ...props }: ComponentProps<'table'>) {
    return (
        <div className="w-full overflow-x-auto rounded-card border border-border">
            <table
                {...props}
                className={cn('w-full caption-bottom text-sm', className)}
            />
        </div>
    );
}

export function TableHeader({ className, ...props }: ComponentProps<'thead'>) {
    return (
        <thead
            {...props}
            className={cn(
                'bg-muted/70 text-left text-xs text-muted-foreground [&_tr]:border-b [&_tr]:border-border',
                className,
            )}
        />
    );
}

export function TableBody({ className, ...props }: ComponentProps<'tbody'>) {
    return (
        <tbody
            {...props}
            className={cn('[&_tr:last-child]:border-0', className)}
        />
    );
}

export function TableRow({ className, ...props }: ComponentProps<'tr'>) {
    return (
        <tr
            {...props}
            className={cn(
                'border-b border-border transition-colors hover:bg-muted/40 data-[state=selected]:bg-muted',
                className,
            )}
        />
    );
}

export function TableHead({ className, ...props }: ComponentProps<'th'>) {
    return (
        <th
            {...props}
            className={cn(
                'h-11 px-4 font-medium [&:has([role=checkbox])]:pr-0',
                className,
            )}
        />
    );
}

export function TableCell({ className, ...props }: ComponentProps<'td'>) {
    return (
        <td
            {...props}
            className={cn(
                'p-4 align-middle [&:has([role=checkbox])]:pr-0',
                className,
            )}
        />
    );
}
