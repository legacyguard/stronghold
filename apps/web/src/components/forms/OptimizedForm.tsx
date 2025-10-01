"use client";

import React, { ReactNode } from 'react';
import { useForm, FormProvider, UseFormReturn, FieldValues, DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';

interface OptimizedFormProps<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  defaultValues?: DefaultValues<T>;
  onSubmit: (data: T) => void | Promise<void>;
  children: ReactNode;
  className?: string;
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
}

export function OptimizedForm<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className,
  mode = 'onBlur'
}: OptimizedFormProps<T>) {
  const methods = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode,
    // Performance optimization: reduce re-renders
    reValidateMode: 'onBlur',
    shouldFocusError: true,
    shouldUseNativeValidation: false,
    criteriaMode: 'firstError'
  });

  const handleSubmit = methods.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
      // Set form-level error if needed
      methods.setError('root', {
        type: 'manual',
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit} className={cn('space-y-md', className)}>
        {children}
      </form>
    </FormProvider>
  );
}

// Optimized form field components
interface FormFieldProps {
  name: string;
  label?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'date';
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function FormField({
  name,
  label,
  placeholder,
  type = 'text',
  disabled = false,
  required = false,
  className
}: FormFieldProps) {
  const { register, formState: { errors } } = useForm();
  const error = errors[name];

  return (
    <div className={cn('space-y-xs', className)}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-text-dark">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        {...register(name)}
        className={cn(
          'w-full px-sm py-xs border rounded-md transition-colors',
          'border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary',
          'disabled:bg-gray-100 disabled:cursor-not-allowed',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          'text-body'
        )}
      />
      {error && (
        <p className="text-sm text-red-600 mt-xs">
          {error.message as string}
        </p>
      )}
    </div>
  );
}

interface FormTextareaProps extends Omit<FormFieldProps, 'type'> {
  rows?: number;
}

export function FormTextarea({
  name,
  label,
  placeholder,
  disabled = false,
  required = false,
  rows = 4,
  className
}: FormTextareaProps) {
  const { register, formState: { errors } } = useForm();
  const error = errors[name];

  return (
    <div className={cn('space-y-xs', className)}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-text-dark">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        {...register(name)}
        className={cn(
          'w-full px-sm py-xs border rounded-md transition-colors resize-vertical',
          'border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary',
          'disabled:bg-gray-100 disabled:cursor-not-allowed',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          'text-body'
        )}
      />
      {error && (
        <p className="text-sm text-red-600 mt-xs">
          {error.message as string}
        </p>
      )}
    </div>
  );
}

interface FormSelectProps extends Omit<FormFieldProps, 'type'> {
  options: Array<{ value: string; label: string }>;
}

export function FormSelect({
  name,
  label,
  placeholder,
  options,
  disabled = false,
  required = false,
  className
}: FormSelectProps) {
  const { register, formState: { errors } } = useForm();
  const error = errors[name];

  return (
    <div className={cn('space-y-xs', className)}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-text-dark">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={name}
        disabled={disabled}
        {...register(name)}
        className={cn(
          'w-full px-sm py-xs border rounded-md transition-colors',
          'border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary',
          'disabled:bg-gray-100 disabled:cursor-not-allowed',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          'text-body'
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600 mt-xs">
          {error.message as string}
        </p>
      )}
    </div>
  );
}

// Form submission state component
interface FormSubmitButtonProps {
  children: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FormSubmitButton({
  children,
  loading = false,
  disabled = false,
  className
}: FormSubmitButtonProps) {
  const { formState } = useForm();

  return (
    <button
      type="submit"
      disabled={disabled || loading || formState.isSubmitting}
      className={cn(
        'inline-flex items-center justify-center px-lg py-sm',
        'bg-primary text-white rounded-md font-medium',
        'hover:bg-primary-dark transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        className
      )}
    >
      {(loading || formState.isSubmitting) && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}