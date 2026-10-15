import { AuthPageLayout } from '@/components/AuthPageLayout';
import { LoginForm } from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <AuthPageLayout title="Log in">
      <LoginForm />
    </AuthPageLayout>
  );
}
