import { useSignIn } from "@clerk/expo";
import { clsx } from "clsx";
import { Link, useRouter } from "expo-router";
import { styled } from "nativewind";
import { useMemo, useState } from "react";
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
    const value =
      asRecord.longMessage ||
      asRecord.message ||
      asRecord.shortMessage ||
      asRecord.code;
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "Could not sign you in. Please try again.";
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

const SignIn = () => {
  const router = useRouter();
  const { signIn, fetchStatus } = useSignIn();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const isSecondFactorStep = signIn.status === "needs_client_trust";

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
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const finalizeAndRoute = async () => {
    await signIn.finalize();
    router.replace("/(tabs)");
  };

  const handleSubmit = async () => {
    if (!validateCredentials()) {
      return;
    }

    const { error } = await signIn.password({
      emailAddress: emailAddress.trim().toLowerCase(),
      password,
    });

    if (error) {
      setFormErrors({
        emailAddress:
          getFirstFieldMessage(error, "identifier") ||
          getFirstFieldMessage(error, "email_address"),
        password: getFirstFieldMessage(error, "password"),
        global: getErrorMessage(error),
      });
      return;
    }

    if (signIn.status === "complete") {
      await finalizeAndRoute();
      return;
    }

    if (signIn.status === "needs_client_trust") {
      await signIn.mfa.sendEmailCode();
      setFormErrors({});
      return;
    }

    setFormErrors({
      global: "Additional verification is required. Please continue.",
    });
  };

  const handleVerify = async () => {
    const verificationCode = code.trim();

    if (!verificationCode) {
      setFormErrors({ code: "Enter the verification code from your inbox." });
      return;
    }

    const { error } = await signIn.mfa.verifyEmailCode({
      code: verificationCode,
    });
    if (error) {
      setFormErrors({
        code: getFirstFieldMessage(error, "code"),
        global: getErrorMessage(error),
      });
      return;
    }

    if (signIn.status === "complete") {
      await finalizeAndRoute();
      return;
    }

    setFormErrors({
      global: "Verification was not completed. Please request a new code.",
    });
  };

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
            <Text className="auth-title">Welcome back</Text>
            <Text className="auth-subtitle">
              Sign in to continue managing your subscriptions
            </Text>
          </View>

          <View className="auth-card">
            {isSecondFactorStep ? (
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
                    For your security, we sent a code to your email.
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
                  onPress={() => signIn.mfa.sendEmailCode()}
                  disabled={fetchStatus === "fetching"}
                >
                  <Text className="auth-secondary-button-text">
                    Resend code
                  </Text>
                </Pressable>

                <Pressable
                  className="auth-secondary-button"
                  onPress={() => {
                    signIn.reset();
                    setCode("");
                    setFormErrors({});
                  }}
                  disabled={fetchStatus === "fetching"}
                >
                  <Text className="auth-secondary-button-text">Start over</Text>
                </Pressable>
              </View>
            ) : (
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Email</Text>
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
                    placeholder="Enter your email"
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
                    placeholder="Enter your password"
                    placeholderTextColor="rgba(0, 0, 0, 0.45)"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="password"
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
                    <Text className="auth-button-text">Sign in</Text>
                  )}
                </Pressable>
              </View>
            )}

            <View className="auth-link-row">
              <Text className="auth-link-copy">New to Recurly?</Text>
              <Link href="/(auth)/sign-up" className="auth-link">
                Create an account
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignIn;
