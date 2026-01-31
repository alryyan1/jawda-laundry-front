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
import { Loader2, Eye, EyeOff, User as UserIcon, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

import { loginUser } from "@/api/authService";
import type { AuthResponse } from "@/api/authService";
import { useAuth } from "@/features/auth/hooks/useAuth";

// Create a function to get translated schema
const createLoginSchema = (t: (key: string) => string) =>
  z.object({
    username: z
      .string()
      .nonempty({ message: t("validation.usernameRequired") }),
    password: z
      .string()
      .nonempty({ message: t("validation.passwordRequired") }),
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
      const axiosError = error as {
        response?: {
          data?: { errors?: { username?: string[] }; message?: string };
        };
      };
      const backendError =
        axiosError.response?.data?.errors?.username?.[0] ||
        axiosError.response?.data?.message;
      toast.error(backendError || t("loginFailed", { ns: "auth" }));
      console.error("Login failed:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
      <div className="grid gap-2">
        <Label
          htmlFor="login-username"
          className="font-medium text-muted-foreground"
        >
          {t("username", { ns: "common" })}
        </Label>
        <div className="relative group">
          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
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
              "h-11 pl-10 border-slate-200 bg-slate-50/50 focus:bg-white transition-all duration-200",
              errors.username && "border-destructive ring-destructive/10",
            )}
          />
        </div>
        {errors.username && (
          <p className="text-sm font-medium text-destructive" role="alert">
            {t(errors.username.message as string)}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="login-password"
            className="font-medium text-muted-foreground"
          >
            {t("password", { ns: "common" })}
          </Label>
          <a
            href="#"
            className="text-xs font-medium text-primary hover:underline pointer-events-none opacity-50"
            tabIndex={-1}
          >
            Forgot password?
          </a>
        </div>
        <div className="relative group">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")}
            aria-invalid={errors.password ? "true" : "false"}
            className={cn(
              "h-11 pl-10 pr-10 border-slate-200 bg-slate-50/50 focus:bg-white transition-all duration-200",
              errors.password && "border-destructive ring-destructive/10",
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={
              showPassword
                ? t("hidePassword", { ns: "auth" })
                : t("showPassword", { ns: "auth" })
            }
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {errors.password && (
          <p className="text-sm font-medium text-destructive" role="alert">
            {t(errors.password.message as string)}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full h-11 text-base font-semibold shadow-md active:shadow-sm"
        disabled={isSubmitting}
      >
        {isSubmitting && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
        )}
        {isSubmitting
          ? t("loggingIn", { ns: "auth" })
          : t("login", { ns: "common" })}
      </Button>
    </form>
  );
};
