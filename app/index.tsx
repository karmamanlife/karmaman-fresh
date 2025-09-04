import { Redirect } from 'expo-router';

export default function Index() {
  // Land inside the tabs group by default
  return <Redirect href='/(tabs)/' />;
}
