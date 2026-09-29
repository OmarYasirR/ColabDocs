// src/components/common/Input.jsx
import { forwardRef, useId } from 'react';
import { cx } from '../../utils/helpers';

const Input = forwardRef(
  (
    {
      label,
      name,
      type = 'text',
      icon: Icon = null,
      error = null,
      hint = null,
      className = '',
      containerClassName = '',
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = name || generatedId;

    return (
      <div className={cx('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}

        <div className="relative">
          {Icon && (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Icon className="h-4 w-4" />
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            className={cx(
              'block w-full rounded-md border bg-white py-2 text-sm text-slate-900 placeholder:text-slate-400',
              'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
              Icon ? 'pl-9 pr-3' : 'px-3',
              error
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100',
              className
            )}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...rest}
          />
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-xs text-rose-600">
            {error}
          </p>
        )}
        {!error && hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;