// src/features/auth/components/LoginForm.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, User as UserIcon, Lock, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

import { loginUser } from "@/api/authService";
import type { AuthResponse } from "@/api/authService";
import { useAuth } from "@/features/auth/hooks/useAuth";

// Create a function to get translated schema
const createLoginSchema = (t: (key: string) => string) => z.object({
  username: z.string().nonempty({ message: t("validation.usernameRequired") }),
  password: z.string().nonempty({ message: t("validation.passwordRequired") }),
});

type LoginFormValues = {
  username: string;
  password: string;
};

interface LoginFormProps {
  onLoginSuccess?: (data: AuthResponse) => void;
}

export const LoginForm: React.FC<LoginFormProps> = () => {
  const { t } = useTranslation(["auth", "common", "validation"]);
  const navigate = useNavigate();
  const location = useLocation();
  const { login: storeLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const loginSchema = createLoginSchema(t);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const authResponse = await loginUser(data);
      if (authResponse.token && authResponse.user) {
        storeLogin(authResponse.token, authResponse.user);
        toast.success(t("loginSuccess", { ns: "auth" }));

        // Redirect to the intended page or home
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      } else {
        throw new Error(t("error.tokenOrUserMissing", { ns: "common" }));
      }
    } catch (error: unknown) {
      // The backend now returns the error on the 'username' key for invalid credentials
      const axiosError = error as { response?: { data?: { errors?: { username?: string[] }, message?: string } } };
      const backendError =
        axiosError.response?.data?.errors?.username?.[0] ||
        axiosError.response?.data?.message;
      toast.error(backendError || t("loginFailed", { ns: "auth" }));
      console.error("Login failed:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Username Field */}
      <div className="space-y-1.5">
        <Label htmlFor="login-username" className="text-xs font-medium text-foreground">
          {t("username", { ns: "common" })}
        </Label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <UserIcon className="h-4 w-4 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
          </div>
          <Input
            id="login-username"
            type="text"
            autoComplete="username"
            placeholder={t("usernamePlaceholder", {
              ns: "auth",
              defaultValue: "Enter your username",
            })}
            {...register("username")}
            aria-invalid={errors.username ? "true" : "false"}
            className={cn(
              "pl-8 h-10 text-sm border-2 transition-all duration-200 focus:border-orange-500 focus:ring-orange-500/20",
              errors.username && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
            )}
          />
        </div>
        {errors.username && (
          <p className="text-xs text-red-500 flex items-center gap-1" role="alert">
            <ChefHat className="h-3 w-3" />
            {t(errors.username.message as string)}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <Label htmlFor="login-password" className="text-xs font-medium text-foreground">
          {t("password", { ns: "common" })}
        </Label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <Lock className="h-4 w-4 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
          </div>
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")}
            aria-invalid={errors.password ? "true" : "false"}
            className={cn(
              "pl-8 pr-10 h-10 text-sm border-2 transition-all duration-200 focus:border-orange-500 focus:ring-orange-500/20",
              errors.password && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0.5 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-orange-500 transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={
              showPassword
                ? t("hidePassword", { ns: "auth" })
                : t("showPassword", { ns: "auth" })
            }
          >
            {showPassword ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-500 flex items-center gap-1" role="alert">
            <ChefHat className="h-3 w-3" />
            {t(errors.password.message as string)}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-10 text-sm font-medium bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            {t("loggingIn", { ns: "auth" })}
          </>
        ) : (
          <>
            <ChefHat className="mr-2 h-3.5 w-3.5" />
            {t("login", { ns: "common" })}
          </>
        )}
      </Button>

      {/* Quick Tips */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          💡 Tip: Use your restaurant staff credentials to access the system
        </p>
      </div>
    </form>
  );
};
