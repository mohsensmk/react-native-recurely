import { View, Text } from "react-native";
import { Link } from "expo-router";

const SignIn = () => {
  return (
    <View>
      <Text>SignIn</Text>
      <Link href="/(auth)/sign-up" className="text-primary mt-4">
        Don{`'`}t have an account? Sign Up
      </Link>
    </View>
  );
};

export default SignIn;
