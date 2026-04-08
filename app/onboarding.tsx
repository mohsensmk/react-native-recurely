import { View, Text } from "react-native";
import { useEffect } from "react";
import { usePostHog } from "posthog-react-native";

const Onboarding = () => {
  const posthog = usePostHog();

  useEffect(() => {
    posthog.capture("onboarding_viewed");
  }, [posthog]);

  return (
    <View>
      <Text>onboarding</Text>
    </View>
  );
};

export default Onboarding;
