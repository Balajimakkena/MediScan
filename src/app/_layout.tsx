import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="profiles" />
        <Stack.Screen name="interaction" />
        <Stack.Screen name="comparison" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="history" />
        <Stack.Screen name="scanner" />
        <Stack.Screen name="nearby-pharmacies" />
         <Stack.Screen name="explore" />
      </Stack>
    </ThemeProvider>
  );
}
