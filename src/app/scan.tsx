import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fmt } from '@/calc';
import { estimateFromPhoto, estimateFromText, lookupBarcode, searchFoods } from '@/food';
import { FoodItem, PendingFood, useStore } from '@/store';
import { C, F } from '@/theme';
import { IconButton, PrimaryButton } from '@/ui';

type Mode = 'foto' | 'barcode' | 'zoeken';

const MODES: { id: Mode; label: string }[] = [
  { id: 'foto', label: 'Foto bord' },
  { id: 'barcode', label: 'Barcode' },
  { id: 'zoeken', label: 'Zoeken' },
];

export default function Scan() {
  const { meal } = useLocalSearchParams<{ meal?: string }>();
  const [mode, setMode] = useState<Mode>('barcode');
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState<string | null>(null);
  const camera = useRef<CameraView>(null);
  const scanning = useRef(false);

  const apiKey = useStore((s) => s.apiKey);
  const recents = useStore((s) => s.recents);
  const setPending = useStore((s) => s.setPending);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[] | null>(null);

  const open = (p: PendingFood) => {
    setPending(p);
    router.replace({ pathname: '/product', params: meal ? { meal } : {} });
  };

  const onBarcode = async (r: BarcodeScanningResult) => {
    if (scanning.current || mode !== 'barcode') return;
    scanning.current = true;
    setBusy('Product opzoeken…');
    try {
      const item = await lookupBarcode(r.data);
      if (item) {
        open({ source: 'barcode', items: [item] });
        return;
      }
      Alert.alert('Niet gevonden', 'Dit product staat nog niet in de database. Zoek het op naam of maak een foto.', [
        { text: 'Zoeken', onPress: () => setMode('zoeken') },
        { text: 'Opnieuw scannen' },
      ]);
    } catch {
      Alert.alert('Geen verbinding', 'Kon het product niet opzoeken. Controleer je internet en probeer opnieuw.');
    } finally {
      setBusy(null);
      setTimeout(() => (scanning.current = false), 1500);
    }
  };

  const takePhoto = async () => {
    if (!apiKey) return;
    setBusy('Foto bekijken…');
    try {
      const pic = await camera.current?.takePictureAsync({ quality: 0.8 });
      if (!pic) throw new Error('Geen foto');
      const ctx = ImageManipulator.manipulate(pic.uri);
      ctx.resize({ width: 1024 });
      const img = await ctx.renderAsync();
      const out = await img.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
      if (!out.base64) throw new Error('Kon foto niet verwerken');
      setBusy('Calorieën inschatten…');
      const res = await estimateFromPhoto(apiKey, out.base64);
      if (res.items.length === 0) {
        Alert.alert('Niets herkend', res.note ?? 'Probeer een foto van bovenaf, met goed licht.');
        return;
      }
      open({ source: 'foto', items: res.items, note: res.note });
    } catch (e) {
      Alert.alert('Dat lukte niet', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const search = async () => {
    if (query.trim().length < 2) return;
    setBusy('Zoeken…');
    try {
      setResults(await searchFoods(query.trim()));
    } catch {
      Alert.alert('Geen verbinding', 'Zoeken lukte niet. Controleer je internet.');
    } finally {
      setBusy(null);
    }
  };

  const estimateText = async () => {
    if (!apiKey || query.trim().length < 2) return;
    setBusy('Calorieën inschatten…');
    try {
      const res = await estimateFromText(apiKey, query.trim());
      if (res.items.length === 0) {
        Alert.alert('Niets gevonden', res.note ?? 'Omschrijf wat je at iets uitgebreider.');
        return;
      }
      open({ source: 'schatting', items: res.items, note: res.note });
    } catch (e) {
      Alert.alert('Dat lukte niet', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const needsCamera = mode !== 'zoeken';
  const cameraReady = permission?.granted;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.camera }} edges={['top', 'bottom']}>
      <View style={st.top}>
        <IconButton icon="close" label="Sluiten" dark onPress={() => router.back()} />
        <Text style={st.heading}>Eten toevoegen</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={st.segment}>
        {MODES.map((m) => (
          <Pressable
            key={m.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === m.id }}
            onPress={() => setMode(m.id)}
            style={[st.segBtn, mode === m.id ? { backgroundColor: '#fff' } : null]}>
            <Text style={[st.segTxt, { color: mode === m.id ? C.camera : '#DDE8E0' }]}>{m.label}</Text>
          </Pressable>
        ))}
      </View>

      {needsCamera ? (
        <View style={st.viewport}>
          {!cameraReady ? (
            <View style={st.center}>
              <Text style={st.hint}>Licht heeft je camera nodig om te scannen.</Text>
              <View style={{ width: 220 }}>
                <PrimaryButton label="Camera toestaan" onPress={requestPermission} />
              </View>
            </View>
          ) : mode === 'foto' && !apiKey ? (
            <View style={st.center}>
              <Text style={st.hint}>
                Foto’s van je bord worden ingeschat door Claude. Daarvoor heb je een eigen API-sleutel nodig.
              </Text>
              <View style={{ width: 220 }}>
                <PrimaryButton label="Sleutel instellen" onPress={() => router.push('/instellingen')} />
              </View>
            </View>
          ) : (
            <>
              <CameraView
                ref={camera}
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
                onBarcodeScanned={mode === 'barcode' && !busy ? onBarcode : undefined}
              />
              <View pointerEvents="none" style={[st.frame, mode === 'barcode' ? { width: 260, height: 150 } : { width: 270, height: 270 }]}>
                <View style={[st.corner, { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 14 }]} />
                <View style={[st.corner, { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 14 }]} />
                <View style={[st.corner, { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 14 }]} />
                <View style={[st.corner, { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 14 }]} />
                {mode === 'barcode' ? <View style={st.laser} /> : null}
              </View>
              <View style={st.hintBox}>
                <Text style={st.hint}>
                  {mode === 'barcode'
                    ? 'Richt op de barcode van de verpakking. Voedingswaarden worden automatisch opgezocht.'
                    : 'Maak een foto van je bord, van bovenaf. Je kan de porties daarna aanpassen.'}
                </Text>
              </View>
            </>
          )}
          {busy ? (
            <View style={st.busy}>
              <ActivityIndicator color="#fff" size="large" />
              <Text style={[st.hint, { marginTop: 12 }]}>{busy}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16, gap: 12 }}>
          <View style={st.searchRow}>
            <TextInput
              accessibilityLabel="Wat heb je gegeten?"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={search}
              placeholder="bv. volkoren brood of 2 sneetjes met kaas"
              placeholderTextColor="#7E8F85"
              returnKeyType="search"
              style={st.searchInput}
              autoFocus
            />
            <Pressable accessibilityRole="button" onPress={search} style={st.searchBtn}>
              <Text style={[st.segTxt, { color: C.camera }]}>Zoek</Text>
            </Pressable>
          </View>
          {apiKey && query.trim().length > 1 ? (
            <Pressable accessibilityRole="button" onPress={estimateText} style={st.estimate}>
              <Text style={[st.segTxt, { color: '#fff' }]}>Laat “{query.trim()}” inschatten</Text>
            </Pressable>
          ) : null}
          {busy ? <ActivityIndicator color="#fff" /> : null}
          <FlatList
            data={results ?? []}
            keyExtractor={(i, n) => `${i.name}-${n}`}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />}
            ListEmptyComponent={
              results && !busy ? <Text style={st.hint}>Niets gevonden. Probeer een ander woord of laat het inschatten.</Text> : null
            }
            renderItem={({ item }) => (
              <Pressable onPress={() => open({ source: 'zoeken', items: [item] })} style={st.result}>
                <View style={{ flex: 1 }}>
                  <Text style={st.resultName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  {item.brand ? <Text style={st.resultSub}>{item.brand}</Text> : null}
                </View>
                <Text style={st.resultSub}>{fmt(item.per100.kcal)} kcal/100 g</Text>
              </Pressable>
            )}
          />
        </View>
      )}

      <View style={st.bottom}>
        {mode === 'foto' && apiKey && cameraReady ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Foto maken" onPress={takePhoto} disabled={!!busy} style={st.shutter}>
            <View style={st.shutterInner} />
          </Pressable>
        ) : null}
        {recents.length > 0 ? (
          <View style={{ gap: 8, alignSelf: 'stretch' }}>
            <Text style={[st.resultSub, { fontSize: 13 }]}>Recent</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {recents.slice(0, 6).map((r) => (
                <Pressable key={r.name} onPress={() => open({ source: 'zoeken', items: [{ ...r }] })} style={st.recent}>
                  <Text style={st.recentTxt} numberOfLines={1}>
                    {r.name} · {fmt((r.per100.kcal * r.grams) / 100)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  heading: { fontFamily: F.displaySemi, fontSize: 20, color: '#fff' },
  segment: { marginHorizontal: 16, flexDirection: 'row', gap: 4, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 16, padding: 4 },
  segBtn: { flex: 1, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  segTxt: { fontFamily: F.semi, fontSize: 14 },
  viewport: { flex: 1, margin: 16, borderRadius: 28, overflow: 'hidden', backgroundColor: '#1E2A24', alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', gap: 16, padding: 24 },
  frame: { position: 'relative' },
  corner: { position: 'absolute', width: 34, height: 34, borderColor: C.cameraAccent },
  laser: { position: 'absolute', left: 16, right: 16, top: '50%', height: 2, backgroundColor: C.cameraAccent },
  hintBox: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: 'rgba(15,21,18,0.75)', borderRadius: 16, padding: 12 },
  hint: { fontFamily: F.body, fontSize: 14, lineHeight: 20, color: '#fff', textAlign: 'center' },
  busy: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,21,18,0.7)', alignItems: 'center', justifyContent: 'center' },
  bottom: { paddingHorizontal: 16, paddingBottom: 16, gap: 16, alignItems: 'center' },
  shutter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: C.cameraAccent },
  recent: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', maxWidth: '100%' },
  recentTxt: { fontFamily: F.body, fontSize: 14, color: '#fff' },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: { flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.10)', color: '#fff', paddingHorizontal: 14, fontFamily: F.body, fontSize: 15 },
  searchBtn: { minHeight: 48, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  estimate: { minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: C.cameraAccent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  result: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  resultName: { fontFamily: F.semi, fontSize: 15, color: '#fff' },
  resultSub: { fontFamily: F.body, fontSize: 13, color: '#9AAEA2' },
});
