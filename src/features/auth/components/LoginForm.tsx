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
import { Loader2, Eye, EyeOff, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import { loginUser, LoginCredentials, AuthResponse } from "@/api/authService";
import { useAuth } from "@/features/auth/hooks/useAuth";

// Zod schema updated for username login
const loginSchema = z.object({
  username: z.string().nonempty({ message: "validation.usernameRequired" }),
  password: z.string().nonempty({ message: "validation.passwordRequired" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onLoginSuccess?: (data: AuthResponse) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const { t } = useTranslation(["auth", "common", "validation"]);
  const navigate = useNavigate();
  const location = useLocation();
  const { login: storeLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

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
    } catch (error: any) {
      // The backend now returns the error on the 'username' key for invalid credentials
      const backendError =
        error.response?.data?.errors?.username?.[0] ||
        error.response?.data?.message;
      toast.error(backendError || t("loginFailed", { ns: "auth" }));
      console.error("Login failed:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="login-username">
          {t("username", { ns: "common" })}
        </Label>
        <div className="relative">
          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="login-username"
            type="text"
            autoComplete="username"
            placeholder={t("usernamePlaceholder", {
              ns: "auth",
              defaultValue: "e.g., admin",
            })}
            {...register("username")}
            aria-invalid={errors.username ? "true" : "false"}
            className={cn("pl-9", errors.username && "border-destructive")}
          />
        </div>
        {errors.username && (
          <p className="text-xs text-destructive" role="alert">
            {t(errors.username.message as string)}
          </p>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="login-password">
          {t("password", { ns: "common" })}
        </Label>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")}
            aria-invalid={errors.password ? "true" : "false"}
            className={cn("pr-10", errors.password && "border-destructive")}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground rtl:left-1 rtl:right-auto"
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
          <p className="text-xs text-destructive" role="alert">
            {t(errors.password.message as string)}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full mt-2 h-10 text-sm"
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
