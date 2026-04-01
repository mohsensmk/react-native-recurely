import { Text } from "react-native";
import { Link } from "expo-router";
import { styled } from "nativewind";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
const SafeAreaView = styled(RNSafeAreaView);
const SignUp = () => {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-background">
      <Text className="text-xl font-bold text-success">SignUp</Text>
      <Link href="/(auth)/sign-in" className="text-primary mt-4">
        Already have an account? Sign In
      </Link>
    </SafeAreaView>
  );
};

export default SignUp;
