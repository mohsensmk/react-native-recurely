import { Text } from "react-native";
import { Link } from "expo-router";
import { styled } from "nativewind";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
const SafeAreaView = styled(RNSafeAreaView);
const SignIn = () => {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-background">
      <Text className="text-xl font-bold text-success">SignIn</Text>
      <Link href="/(auth)/sign-up" className="text-primary mt-4">
        Don{`'`}t have an account? Sign Up
      </Link>
    </SafeAreaView>
  );
};

export default SignIn;
