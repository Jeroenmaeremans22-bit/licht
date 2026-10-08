import { router } from 'expo-router';
import { Alert } from 'react-native';

import { ClaudeError } from './claude';

/** Toont een fout. Ligt de oplossing in de instellingen, dan staat er een knop naartoe. */
export function showError(e: unknown, title = 'Dat lukte niet') {
  const message = e instanceof Error ? e.message : String(e);
  if (e instanceof ClaudeError && e.settings) {
    Alert.alert(title, message, [
      { text: 'Sluiten', style: 'cancel' },
      { text: 'Naar instellingen', onPress: () => router.push('/instellingen') },
    ]);
  } else {
    Alert.alert(title, message);
  }
}
