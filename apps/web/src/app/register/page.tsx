import { AuthPageLayout } from '@/components/AuthPageLayout';
import { RegisterForm } from '@/components/RegisterForm';

export default function RegisterPage() {
  return (
    <AuthPageLayout title="Create an account">
      <RegisterForm />
    </AuthPageLayout>
  );
}
