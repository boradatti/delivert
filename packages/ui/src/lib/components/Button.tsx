import type { FC, ReactNode } from 'react';

import clsx from 'clsx';

export interface ButtonProps {
  size: 'large' | 'medium' | 'icon';
  variant: 'primary' | 'destructive';
  children: ReactNode;
}

export const Button: FC<ButtonProps> = ({ size, variant, children }) => {
  return (
    <button
      className={clsx({
        'rounded-lg px-5 py-2': size === 'large',
        'rounded-md px-4 py-1': size === 'medium',
        'rounded-sm px-1 py-1': size === 'icon'
      }, {
        'bg-green-600/90  text-green-100 hover:bg-green-600':
          variant === 'primary',
        'bg-red-600/90 text-red-100 hover:bg-red-600': variant === 'destructive',
      })}
    >
      {children}
    </button>
  );
};

export default Button;