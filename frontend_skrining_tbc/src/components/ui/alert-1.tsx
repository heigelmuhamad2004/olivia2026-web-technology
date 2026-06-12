import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { X, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

const alertVariants = cva('flex items-stretch w-full gap-2 group-[.toaster]:w-(--width)', {
  variants: {
    variant: {
      secondary: '',
      primary: '',
      destructive: '',
      success: '',
      info: '',
      warning: '',
    },
    appearance: {
      solid: '',
      outline: '',
      light: '',
    },
    size: {
      lg: 'rounded-lg p-4 gap-3 text-base [&&>div>svg]:size-6',
      md: 'rounded-lg p-3.5 gap-2.5 text-sm [&&>div>svg]:size-5',
      sm: 'rounded-md px-3 py-2.5 gap-2 text-xs [&&>div>svg]:size-4',
    },
  },
  compoundVariants: [
    /* Light Appearance - Matches Vercel DESIGN.md exactly */
    {
      variant: 'primary',
      appearance: 'light',
      className: 'bg-[#fafafa] text-[#171717] border border-[#ebebeb] dark:bg-[#171717] dark:border-[#333] dark:text-[#f2f2f2]',
    },
    {
      variant: 'destructive',
      appearance: 'light',
      // error-soft: #f7d4d6, error-deep: #c50000, error: #ee0000
      className: 'bg-[#f7d4d6] text-[#c50000] border border-[#ee0000]/20 dark:bg-[#ee0000]/10 dark:border-[#ee0000]/20 dark:text-[#ee0000]',
    },
    {
      variant: 'success',
      appearance: 'light',
      // Vercel success is blue: link-bg-soft: #d3e5ff, link-deep: #0761d1, link: #0070f3
      className: 'bg-[#d3e5ff] text-[#0761d1] border border-[#0070f3]/20 dark:bg-[#0070f3]/10 dark:border-[#0070f3]/20 dark:text-[#0070f3]',
    },
    {
      variant: 'warning',
      appearance: 'light',
      // warning-soft: #ffefcf, warning-deep: #ab570a, warning: #f5a623
      className: 'bg-[#ffefcf] text-[#ab570a] border border-[#f5a623]/20 dark:bg-[#f5a623]/10 dark:border-[#f5a623]/20 dark:text-[#f5a623]',
    },
  ],
  defaultVariants: {
    variant: 'secondary',
    appearance: 'light',
    size: 'md',
  },
});

interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  close?: boolean;
  onClose?: () => void;
}

function Alert({ className, variant, size, appearance, close = false, onClose, children, ...props }: AlertProps) {
  return (
    <div role="alert" className={cn(alertVariants({ variant, size, appearance }), className)} {...props}>
      {children}
      {close && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          aria-label="Dismiss"
          className={cn('group shrink-0 h-6 w-6 rounded-md ml-auto hover:bg-transparent')}
        >
          <X className="opacity-60 group-hover:opacity-100 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <div className={cn('grow tracking-tight font-medium', className)} {...props} />;
}

function AlertIcon({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('shrink-0 mt-0.5', className)} {...props}>{children}</div>;
}

// Custom Toast Helper
export const customToast = {
  success: (message: string) => toast.custom((t) => (
    <Alert variant="success" appearance="light" close onClose={() => toast.dismiss(t)} className="w-full pointer-events-auto">
      <AlertIcon><CheckCircle2 className="h-4 w-4" /></AlertIcon>
      <AlertTitle>{message}</AlertTitle>
    </Alert>
  ), { duration: 4000 }),
  error: (message: string) => toast.custom((t) => (
    <Alert variant="destructive" appearance="light" close onClose={() => toast.dismiss(t)} className="w-full pointer-events-auto">
      <AlertIcon><XCircle className="h-4 w-4" /></AlertIcon>
      <AlertTitle>{message}</AlertTitle>
    </Alert>
  ), { duration: 5000 }),
  warning: (message: string) => toast.custom((t) => (
    <Alert variant="warning" appearance="light" close onClose={() => toast.dismiss(t)} className="w-full pointer-events-auto">
      <AlertIcon><AlertTriangle className="h-4 w-4" /></AlertIcon>
      <AlertTitle>{message}</AlertTitle>
    </Alert>
  ), { duration: 5000 }),
};