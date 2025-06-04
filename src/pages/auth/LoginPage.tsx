import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/lib/axios'; // Ensure this path is correct
import { toast } from "sonner"


const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      // IMPORTANT: Your Laravel backend needs /sanctum/csrf-cookie first for SPA auth
      await apiClient.get('/sanctum/csrf-cookie');
      const response = await apiClient.post('/login', data); // Adjust to your Laravel login endpoint
      
      // Assuming successful login, your backend might return user data or just a success status.
      // For Sanctum SPA, the session cookie is set automatically.
      // You might want to store some user info or a 'loggedIn' flag in localStorage
      // or fetch user data via a '/api/user' endpoint.
      
      console.log('Login successful:', response.data);
      localStorage.setItem('authToken', 'dummy_token_spa_auth_uses_cookies'); // For SPA, cookie is king, this is just for client-side check
      toast.success("Login successful!");
      navigate('/'); // Redirect to dashboard
    } catch (error: any) {
      console.error('Login failed:', error);
      const errorMessage = error.response?.data?.message || "Login failed. Please check your credentials.";
      toast.error(errorMessage);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">{t('login')}</CardTitle>
        <CardDescription>
          Enter your email below to login to your {t('appName')} account.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              {...register('email')}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : t('login')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
export default LoginPage;