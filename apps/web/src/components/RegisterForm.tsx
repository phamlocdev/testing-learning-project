'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { registerSchema, type RegisterFormValues } from '@/lib/validation/auth-schemas';

const inputClassName =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200';

export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    setSubmitError(null);

    try {
      await registerUser(values.email, values.password);
      router.push('/');
    } catch {
      setSubmitError('An account with this email already exists');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <label className="text-sm font-medium text-slate-700">
        Email
        <input type="email" className={inputClassName} {...register('email')} />
        {errors.email && (
          <p role="alert" className="mt-1 text-sm text-red-600">
            {errors.email.message}
          </p>
        )}
      </label>
      <label className="text-sm font-medium text-slate-700">
        Password
        <input type="password" className={inputClassName} {...register('password')} />
        {errors.password && (
          <p role="alert" className="mt-1 text-sm text-red-600">
            {errors.password.message}
          </p>
        )}
      </label>
      <label className="text-sm font-medium text-slate-700">
        Confirm password
        <input type="password" className={inputClassName} {...register('confirmPassword')} />
        {errors.confirmPassword && (
          <p role="alert" className="mt-1 text-sm text-red-600">
            {errors.confirmPassword.message}
          </p>
        )}
      </label>
      {submitError && (
        <p role="alert" className="text-sm text-red-600">
          {submitError}
        </p>
      )}
      <button
        type="submit"
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
      >
        Register
      </button>
      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-slate-900 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
