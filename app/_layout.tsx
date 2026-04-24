import { useColorScheme } from "@/hooks/use-color-scheme";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { StripeProvider } from "@stripe/stripe-react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

export default function RootLayout() {

  const colorScheme = useColorScheme();

  return (

    <StripeProvider
      publishableKey="pk_test_51T8jRdCvLnmwKFNvzeqvXa4BRl0QOXDZPYFarE9GdoU9J4RNI00S42MFF4lSl0tTVaVOrzjuSsh78xyZHsG8MTGG00zRcLnBqe"
    >

      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }} />
          <StatusBar style="auto" />
        </ThemeProvider>
      </GestureHandlerRootView>

    </StripeProvider>

  );
}