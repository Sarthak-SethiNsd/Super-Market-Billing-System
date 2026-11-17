import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline' | 'staff' | 'admin';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium tracking-wide';

  const variants = {
    default: 'bg-[#EFEFEA] text-[#303631] border border-[#E5E4DC]',
    success: 'bg-[#EEF5F0] text-[#2E6F40] border border-[#C2D9C8]',
    warning: 'bg-[#FAF3EA] text-[#C87D20] border border-[#F0DDC5]',
    danger: 'bg-[#F8EFEF] text-[#A63A38] border border-[#ECD1D0]',
    outline: 'border border-[#E5E4DC] text-[#777D76] bg-transparent',
    staff: 'bg-[#EEF5F0] text-[#285943] border border-[#C2D9C8]',
    admin: 'bg-[#EFEFEA] text-[#303631] border border-[#D4D3C9] font-semibold',
  };

  return (
    <span className={twMerge(clsx(base, variants[variant], className))} {...props}>
      {children}
    </span>
  );
};
