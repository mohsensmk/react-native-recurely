import { useAuth, useSignUp } from "@clerk/expo";
import { clsx } from "clsx";
import { type Href, Link, useRouter } from "expo-router";
import { styled } from "nativewind";
import { useMemo, useState } from "react";
import { usePostHog } from "posthog-react-native";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

type FormErrors = {
  emailAddress?: string;
  password?: string;
  code?: string;
  global?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const asRecord = error as Record<string, unknown>;

    const possible = ["longMessage", "message", "code", "shortMessage"];
    for (const key of possible) {
      const value = asRecord[key];
      if (typeof value === "string" && value.trim()) {
        return value;
      }
    }
  }

  return "Something went wrong. Please try again.";
};

const getFirstFieldMessage = (
  error: unknown,
  field: string,
): string | undefined => {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const asRecord = error as {
    errors?: {
      meta?: { paramName?: string };
      message?: string;
      longMessage?: string;
    }[];
  };

  const fieldError = asRecord.errors?.find(
    (item) => item.meta?.paramName === field,
  );

  return fieldError?.longMessage || fieldError?.message;
};

const SignUp = () => {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { signUp, fetchStatus } = useSignUp();
  const posthog = usePostHog();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const isVerifyingEmail =
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0;

  const canSubmitCredentials = useMemo(() => {
    return (
      emailAddress.trim().length > 0 &&
      password.length > 0 &&
      fetchStatus !== "fetching"
    );
  }, [emailAddress, password, fetchStatus]);

  const clearFieldError = (key: keyof FormErrors) => {
    setFormErrors((current) => ({
      ...current,
      [key]: undefined,
      global: undefined,
    }));
  };

  const validateCredentials = (): boolean => {
    const errors: FormErrors = {};
    const trimmedEmail = emailAddress.trim();

    if (!trimmedEmail) {
      errors.emailAddress = "Email is required.";
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.emailAddress = "Enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 8) {
      errors.password = "Use at least 8 characters.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateCredentials()) {
      return;
    }

    const { error } = await signUp.password({
      emailAddress: emailAddress.trim().toLowerCase(),
      password,
    });

    if (error) {
      posthog.capture("sign_up_failed", {
        error_message: getErrorMessage(error),
      });
      setFormErrors({
        emailAddress: getFirstFieldMessage(error, "email_address"),
        password: getFirstFieldMessage(error, "password"),
        global: getErrorMessage(error),
      });
      return;
    }

    setFormErrors({});
    await signUp.verifications.sendEmailCode();
  };

  const handleVerify = async () => {
    const verificationCode = code.trim();
    if (!verificationCode) {
      setFormErrors({ code: "Enter the verification code from your inbox." });
      return;
    }

    const { error } = await signUp.verifications.verifyEmailCode({
      code: verificationCode,
    });

    if (error) {
      posthog.capture("email_verification_failed", {
        error_message: getErrorMessage(error),
      });
      setFormErrors({
        code: getFirstFieldMessage(error, "code"),
        global: getErrorMessage(error),
      });
      return;
    }

    if (signUp.status === "complete") {
      posthog.identify(emailAddress.trim().toLowerCase(), {
        $set: { email: emailAddress.trim().toLowerCase() },
        $set_once: { sign_up_date: new Date().toISOString() },
      });
      posthog.capture("user_signed_up", {
        email: emailAddress.trim().toLowerCase(),
      });
      await signUp.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            return;
          }

          const url = decorateUrl("/(tabs)");
          if (url.startsWith("http")) {
            return;
          }

          router.replace(url as Href);
        },
      });
      return;
    }

    setFormErrors({
      global: "We could not complete your account setup. Please try again.",
    });
  };

  if (isSignedIn || signUp.status === "complete") {
    return null;
  }

  return (
    <SafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        className="auth-screen"
      >
        <ScrollView
          className="auth-scroll"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="auth-content"
        >
          <View className="auth-brand-block">
            <View className="auth-logo-wrap">
              <View className="auth-logo-mark">
                <Text className="auth-logo-mark-text">R</Text>
              </View>
              <View>
                <Text className="auth-wordmark">Recurly</Text>
                <Text className="auth-wordmark-sub">SMART BILLING</Text>
              </View>
            </View>
            <Text className="auth-title">Create your account</Text>
            <Text className="auth-subtitle">
              Track renewals, control spending, and never miss a billing date.
            </Text>
          </View>

          <View className="auth-card">
            {isVerifyingEmail ? (
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Verification code</Text>
                  <TextInput
                    className={clsx(
                      "auth-input",
                      formErrors.code && "auth-input-error",
                    )}
                    value={code}
                    onChangeText={(value) => {
                      setCode(value);
                      clearFieldError("code");
                    }}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor="rgba(0, 0, 0, 0.45)"
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {formErrors.code ? (
                    <Text className="auth-error">{formErrors.code}</Text>
                  ) : null}
                  <Text className="auth-helper">
                    Check your email for a one-time verification code.
                  </Text>
                </View>

                {formErrors.global ? (
                  <Text className="auth-error">{formErrors.global}</Text>
                ) : null}

                <Pressable
                  className={clsx(
                    "auth-button",
                    fetchStatus === "fetching" && "auth-button-disabled",
                  )}
                  disabled={fetchStatus === "fetching"}
                  onPress={handleVerify}
                >
                  {fetchStatus === "fetching" ? (
                    <ActivityIndicator color="#081126" />
                  ) : (
                    <Text className="auth-button-text">
                      Verify and continue
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  className="auth-secondary-button"
                  onPress={() => signUp.verifications.sendEmailCode()}
                  disabled={fetchStatus === "fetching"}
                >
                  <Text className="auth-secondary-button-text">
                    Resend verification code
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Email address</Text>
                  <TextInput
                    className={clsx(
                      "auth-input",
                      formErrors.emailAddress && "auth-input-error",
                    )}
                    value={emailAddress}
                    onChangeText={(value) => {
                      setEmailAddress(value);
                      clearFieldError("emailAddress");
                    }}
                    placeholder="you@company.com"
                    placeholderTextColor="rgba(0, 0, 0, 0.45)"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                  />
                  {formErrors.emailAddress ? (
                    <Text className="auth-error">
                      {formErrors.emailAddress}
                    </Text>
                  ) : null}
                </View>

                <View className="auth-field">
                  <Text className="auth-label">Password</Text>
                  <TextInput
                    className={clsx(
                      "auth-input",
                      formErrors.password && "auth-input-error",
                    )}
                    value={password}
                    onChangeText={(value) => {
                      setPassword(value);
                      clearFieldError("password");
                    }}
                    placeholder="At least 8 characters"
                    placeholderTextColor="rgba(0, 0, 0, 0.45)"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                  />
                  {formErrors.password ? (
                    <Text className="auth-error">{formErrors.password}</Text>
                  ) : null}
                </View>

                {formErrors.global ? (
                  <Text className="auth-error">{formErrors.global}</Text>
                ) : null}

                <Pressable
                  className={clsx(
                    "auth-button",
                    !canSubmitCredentials && "auth-button-disabled",
                  )}
                  disabled={!canSubmitCredentials}
                  onPress={handleSubmit}
                >
                  {fetchStatus === "fetching" ? (
                    <ActivityIndicator color="#081126" />
                  ) : (
                    <Text className="auth-button-text">Create account</Text>
                  )}
                </Pressable>

                <View nativeID="clerk-captcha" />
              </View>
            )}

            <View className="auth-link-row">
              <Text className="auth-link-copy">Already have an account?</Text>
              <Link href="/(auth)/sign-in" className="auth-link">
                Sign in
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;
