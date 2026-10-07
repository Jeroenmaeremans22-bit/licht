import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, TextInput, View } from 'react-native';

import { openHealthConnectSettings } from '@/health';
import { useStore } from '@/store';
import { C, F } from '@/theme';
import { Body, Card, H2, IconButton, Muted, PrimaryButton, Row, Screen, TextButton, Title } from '@/ui';

export default function Instellingen() {
  const apiKey = useStore((s) => s.apiKey);
  const setApiKey = useStore((s) => s.setApiKey);
  const connected = useStore((s) => s.healthConnected);
  const setConnected = useStore((s) => s.setHealthConnected);
  const [key, setKey] = useState(apiKey);

  const save = () => {
    const k = key.trim();
    if (k && !k.startsWith('sk-ant-')) {
      Alert.alert('Klopt dit wel?', 'Een Claude API-sleutel begint met “sk-ant-”.');
      return;
    }
    setApiKey(k);
    Alert.alert('Opgeslagen', k ? 'Foto’s en omschrijvingen kunnen nu ingeschat worden.' : 'De sleutel is verwijderd.');
  };

  const wipe = () =>
    Alert.alert('Alles wissen?', 'Al je maaltijden, gewichten en antwoorden worden van deze gsm verwijderd.', [
      { text: 'Annuleren', style: 'cancel' },
      {
        text: 'Wissen',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('licht-data');
          useStore.setState({
            onboarded: false,
            entries: [],
            weights: [],
            recents: [],
            apiKey: '',
            healthConnected: false,
            pending: null,
          });
          router.dismissAll();
          router.replace('/onboarding');
        },
      },
    ]);

  return (
    <Screen>
      <Row style={{ gap: 12, paddingTop: 8 }}>
        <IconButton icon="back" label="Terug" onPress={() => router.back()} />
        <Title style={{ fontSize: 26 }}>Instellingen</Title>
      </Row>

      <Card style={{ gap: 12 }}>
        <H2 style={{ fontSize: 18 }}>Foto’s laten inschatten</H2>
        <Body style={{ fontSize: 14 }}>
          Een foto van je bord (of een omschrijving zoals “2 sneetjes met kaas”) wordt naar Claude gestuurd, die schat wat
          erop staat en hoeveel calorieën het is. Daarvoor heb je een eigen API-sleutel nodig van Anthropic. Je betaalt per
          gebruik, meestal minder dan een cent per foto.
        </Body>
        <TextButton label="Sleutel aanmaken op console.anthropic.com" onPress={() => Linking.openURL('https://console.anthropic.com/settings/keys')} />
        <TextInput
          accessibilityLabel="API-sleutel"
          value={key}
          onChangeText={setKey}
          placeholder="sk-ant-…"
          placeholderTextColor="#8A958E"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          style={{
            minHeight: 48,
            borderRadius: 14,
            borderWidth: 2,
            borderColor: C.line,
            paddingHorizontal: 14,
            fontFamily: F.body,
            fontSize: 15,
            color: C.ink,
          }}
        />
        <PrimaryButton label="Sleutel opslaan" onPress={save} />
        <Muted style={{ fontSize: 12 }}>De sleutel blijft alleen op deze gsm bewaard. Barcodes scannen en zoeken werkt ook zonder sleutel.</Muted>
      </Card>

      <Card style={{ gap: 8 }}>
        <H2 style={{ fontSize: 18 }}>Health Connect</H2>
        <Body style={{ fontSize: 14 }}>{connected ? 'Gekoppeld. Je beweging wordt automatisch gemeten.' : 'Niet gekoppeld. Koppel via het tabblad Beweging.'}</Body>
        <TextButton label="Toegang beheren in Health Connect" onPress={openHealthConnectSettings} />
        {connected ? <TextButton label="Ontkoppelen in de app" onPress={() => setConnected(false)} color={C.warn} /> : null}
      </Card>

      <Card style={{ gap: 8 }}>
        <H2 style={{ fontSize: 18 }}>Je gegevens</H2>
        <Body style={{ fontSize: 14 }}>Alles wat je invult, blijft op je gsm en er is geen account. Alleen barcodes en zoekwoorden gaan naar Open Food Facts, en foto’s die je laat inschatten naar Claude.</Body>
        <View style={{ alignItems: 'flex-start' }}>
          <TextButton label="Alles wissen" onPress={wipe} color={C.warn} />
        </View>
      </Card>

      <Muted style={{ fontSize: 12, textAlign: 'center' }}>
        Licht is een hulpmiddel, geen medisch advies. Heb je een medische aandoening, of ben je zwanger? Overleg dan eerst met je huisarts.
      </Muted>
    </Screen>
  );
}
