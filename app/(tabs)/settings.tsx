import { useClerk, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { styled } from "nativewind";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { usePostHog } from "posthog-react-native";

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  const posthog = usePostHog();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    setErrorMessage(null);
    try {
      posthog.capture("user_signed_out", {
        email: user?.primaryEmailAddress?.emailAddress,
      });
      posthog.reset();
      await signOut();
      router.replace("/(auth)/sign-in");
    } catch {
      setErrorMessage("We could not sign you out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background px-5 pt-6">
      <View className="rounded-2xl border border-border bg-card p-5">
        <Text className="text-2xl font-sans-bold text-primary">Settings</Text>
        <Text className="mt-2 text-sm font-sans-medium text-muted-foreground">
          Signed in as{" "}
          {user?.primaryEmailAddress?.emailAddress || "your account"}
        </Text>

        {errorMessage ? (
          <Text className="mt-3 text-sm font-sans-medium text-destructive">
            {errorMessage}
          </Text>
        ) : null}

        <Pressable
          className="mt-6 items-center rounded-2xl bg-primary py-4"
          onPress={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <ActivityIndicator color="#fff9e3" />
          ) : (
            <Text className="font-sans-bold text-background">Sign out</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default Settings;
