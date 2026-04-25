import React, { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { Checkbox } from "../../../components/ui/Checkbox";
import { useAuth } from "../../../contexts/AuthContext";

const LoginForm = ({ onLogin, isLoading: isLoadingProp }) => {
  const { signIn } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const effectiveLoading = typeof isLoadingProp === "boolean" ? isLoadingProp : isLoading;

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");

    if (validateForm()) {
      try {
        if (typeof onLogin === "function") {
          await onLogin(formData);
          return;
        }

        setIsLoading(true);
        const { error } = await signIn(formData.email, formData.password);

        if (error) {
          setAuthError(error.message || "Invalid login credentials. Please try again.");
          return;
        }

        // Redirect based on user role
        // We need to wait a moment for the auth context to update with user profile
        setTimeout(() => {
          // This will be handled by the login page after auth state updates
          // The login page will read userProfile and redirect accordingly
        }, 100);
      } catch (error) {
        setAuthError(error?.message || "An unexpected error occurred. Please try again.");
      } finally {
        if (typeof onLogin !== "function") {
          setIsLoading(false);
        }
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "rememberMe" ? checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {authError && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {authError}
        </div>
      )}

      <div>
        <Input
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          required
        />
      </div>

      <div>
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          required
          endIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="focus:outline-none"
            >
              <Icon
                name={showPassword ? "eye-off" : "eye"}
                className="w-5 h-5 text-gray-500"
              />
            </button>
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <Checkbox
          id="rememberMe"
          name="rememberMe"
          checked={formData.rememberMe}
          onCheckedChange={(checked) =>
            handleChange({ target: { name: "rememberMe", checked } })
          }
          label="Remember me"
        />

        <Link
          to="/forgot-password"
          className="text-sm text-primary hover:text-primary/80"
        >
          Forgot password?
        </Link>
      </div>

      <Button
        type="submit"
        className="w-full"
        variant="primary"
        loading={effectiveLoading}
      >
        Sign In
      </Button>
    </form>
  );
};

export default LoginForm;
