import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", ...props }, ref) => {
    const hasError = !!error;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-sans font-semibold text-brand-navy-700 mb-2"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full h-11 px-4 rounded-md border bg-white text-brand-nav placeholder-brand-navy-400 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white transition-colors ${
            hasError
              ? "border-status-error focus:ring-status-error focus:border-status-error"
              : "border-brand-navy-200 focus:ring-brand-primary-300 focus:border-brand-primary-500"
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm font-sans text-status-error">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm font-sans text-brand-navy-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

