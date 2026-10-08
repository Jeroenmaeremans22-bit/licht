import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, Text, TextInput, View } from 'react-native';

import { ClaudeError, cleanKey, keyLooksValid, testKey } from '@/claude';
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
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const paste = async () => {
    const text = cleanKey(await Clipboard.getStringAsync());
    if (!text) return Alert.alert('Klembord is leeg', 'Kopieer eerst de sleutel op console.anthropic.com.');
    setKey(text);
    setStatus(null);
  };

  /** Bewaart de sleutel en test ze meteen met een kleine vraag aan Claude. */
  const saveAndTest = async () => {
    const k = cleanKey(key);
    setKey(k);
    if (!k) {
      setApiKey('');
      setStatus({ ok: false, text: 'Sleutel verwijderd.' });
      return;
    }
    if (!keyLooksValid(k)) {
      setStatus({ ok: false, text: 'Dit is geen volledige sleutel. Ze begint met “sk-ant-” en is ongeveer 100 tekens lang. Kopieer ze opnieuw.' });
      return;
    }
    setApiKey(k);
    setTesting(true);
    try {
      await testKey(k);
      setStatus({ ok: true, text: 'Alles werkt! Foto’s van je bord en verpakkingen kunnen nu ingeschat worden.' });
    } catch (e) {
      setStatus({ ok: false, text: e instanceof ClaudeError ? e.message : String(e) });
    } finally {
      setTesting(false);
    }
  };

  const masked = apiKey ? `${apiKey.slice(0, 10)}…${apiKey.slice(-4)}` : null;

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
            products: {},
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
          Foto’s van je bord en van verpakkingen worden ingeschat door Claude. Daarvoor heb je een eigen API-sleutel nodig. Dat
          is iets anders dan een Claude-abonnement: je laadt los tegoed op en betaalt per foto, ongeveer een cent.
        </Body>
        <View style={{ gap: 6 }}>
          {[
            'Ga naar console.anthropic.com en maak een account (of log in).',
            'Ga naar Billing en zet tegoed op, bv. $5. Zonder tegoed werkt de sleutel niet.',
            'Ga naar API keys, tik op Create Key en kopieer de sleutel.',
            'Kom terug, tik op Plakken en dan op Opslaan en testen.',
          ].map((t, i) => (
            <Row key={i} style={{ gap: 10, alignItems: 'flex-start' }}>
              <Text style={{ fontFamily: F.display, fontSize: 15, color: C.green, width: 16 }}>{i + 1}</Text>
              <Body style={{ fontSize: 14, flex: 1 }}>{t}</Body>
            </Row>
          ))}
        </View>
        <TextButton label="Open console.anthropic.com" onPress={() => Linking.openURL('https://console.anthropic.com/settings/keys')} />
        <Row style={{ gap: 8 }}>
          <TextInput
            accessibilityLabel="API-sleutel"
            value={key}
            onChangeText={(t) => {
              setKey(t);
              setStatus(null);
            }}
            placeholder="sk-ant-…"
            placeholderTextColor="#8A958E"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            style={{
              flex: 1,
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
          <Pressable
            accessibilityRole="button"
            onPress={paste}
            style={{ minHeight: 48, paddingHorizontal: 14, borderRadius: 14, backgroundColor: C.greenSoft, justifyContent: 'center' }}>
            <Text style={{ fontFamily: F.semi, color: C.greenDark }}>Plakken</Text>
          </Pressable>
        </Row>
        <PrimaryButton label="Opslaan en testen" onPress={saveAndTest} loading={testing} />
        {status ? (
          <View style={{ backgroundColor: status.ok ? C.greenSoft : C.warnSoft, borderRadius: 14, padding: 12 }}>
            <Body style={{ fontSize: 14, color: status.ok ? C.greenText : C.warn }}>{status.text}</Body>
          </View>
        ) : null}
        <Muted style={{ fontSize: 12 }}>
          {masked ? `Opgeslagen sleutel: ${masked}. ` : ''}De sleutel blijft alleen op deze gsm. Barcodes scannen en zoeken werkt
          ook zonder sleutel.
        </Muted>
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
