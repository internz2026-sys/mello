import { Stack } from 'expo-router';

export default function RitualsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FAF6EE' },
        animation: 'fade',
      }}
    />
  );
}
