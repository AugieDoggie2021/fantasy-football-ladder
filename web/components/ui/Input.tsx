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
            className="block text-sm font-sans font-semibold text-slate-200 mb-2"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full h-11 px-4 rounded-xl border bg-slate-800/70 text-slate-200 placeholder:text-slate-500 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 ${
            hasError
              ? "border-status-error focus:border-status-error"
              : "border-slate-600/40"
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm font-sans text-status-error">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm font-sans text-slate-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
