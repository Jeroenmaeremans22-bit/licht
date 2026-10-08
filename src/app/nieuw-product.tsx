import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { readLabel } from '@/food';
import { FoodItem, useStore } from '@/store';
import { C, F } from '@/theme';
import { Body, Card, Grid, IconButton, Muted, PrimaryButton, Row, Screen, Strong, TextButton, Title } from '@/ui';

const toNum = (v: string) => {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};
const show = (n: number | undefined) => (n === undefined ? '' : String(Math.round(n * 10) / 10).replace('.', ','));

function Field({
  label,
  value,
  onChange,
  unit,
  numeric = true,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  numeric?: boolean;
  placeholder?: string;
}) {
  return (
    <View style={st.field}>
      <Text style={st.label}>{label}</Text>
      <Row style={{ gap: 6 }}>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={(t) => onChange(numeric ? t.replace(/[^0-9.,]/g, '') : t)}
          keyboardType={numeric ? 'decimal-pad' : 'default'}
          placeholder={placeholder}
          placeholderTextColor="#8A958E"
          style={st.input}
          maxLength={numeric ? 6 : 60}
        />
        {unit ? <Muted>{unit}</Muted> : null}
      </Row>
    </View>
  );
}

export default function NieuwProduct() {
  const p = useLocalSearchParams<{
    code: string;
    reason?: 'notfound' | 'incomplete';
    name?: string;
    brand?: string;
    portion?: string;
    meal?: string;
  }>();
  const apiKey = useStore((s) => s.apiKey);
  const saveProduct = useStore((s) => s.saveProduct);
  const setPending = useStore((s) => s.setPending);

  const [name, setName] = useState(p.name ?? '');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [portion, setPortion] = useState(p.portion ?? '');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const photoLabel = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert('Camera nodig', 'Geef Licht toegang tot je camera om het etiket te fotograferen.');
    const shot = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (shot.canceled || !shot.assets?.[0]) return;
    setBusy(true);
    try {
      const ctx = ImageManipulator.manipulate(shot.assets[0].uri);
      ctx.resize({ width: 1400 });
      const img = await ctx.renderAsync();
      const out = await img.saveAsync({ format: SaveFormat.JPEG, compress: 0.8, base64: true });
      if (!out.base64) throw new Error('Kon de foto niet verwerken.');
      const r = await readLabel(apiKey, out.base64);
      if (r.per100.kcal === undefined) {
        Alert.alert('Geen tabel gevonden', r.note ?? 'Fotografeer de voedingswaardetabel van dichtbij, recht en met goed licht.');
        return;
      }
      if (r.name && !name) setName(r.name);
      setKcal(show(r.per100.kcal));
      setProtein(show(r.per100.protein));
      setCarbs(show(r.per100.carbs));
      setFat(show(r.per100.fat));
      setFiber(show(r.per100.fiber));
      if (r.servingGrams && !portion) setPortion(show(r.servingGrams));
      setNote(r.note ?? 'Waarden overgenomen van het etiket. Kijk ze even na.');
    } catch (e) {
      Alert.alert('Dat lukte niet', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const k = toNum(kcal);
  const port = toNum(portion);
  let error = '';
  if (!name.trim()) error = 'Geef het product een naam.';
  else if (!(k >= 0 && k <= 900)) error = 'Vul de kilocalorieën per 100 g in (staat op het etiket).';
  else if (portion && !(port > 0 && port <= 2000)) error = 'De portie moet tussen 1 en 2000 g liggen.';

  const save = () => {
    const opt = (v: string) => (Number.isFinite(toNum(v)) ? toNum(v) : 0);
    const hasPortion = Number.isFinite(port) && port > 0;
    const item: FoodItem = {
      name: name.trim(),
      brand: p.brand || undefined,
      per100: { kcal: k, protein: opt(protein), carbs: opt(carbs), fat: opt(fat), fiber: opt(fiber) },
      grams: hasPortion ? port : 100,
      step: hasPortion ? port : 10,
      servingLabel: hasPortion ? `1 portie = ${Math.round(port)} g` : undefined,
    };
    if (p.code) saveProduct(p.code, item, true);
    setPending({ source: 'eigen', items: [item] });
    router.replace({ pathname: '/product', params: p.meal ? { meal: p.meal } : {} });
  };

  const intro =
    p.reason === 'incomplete'
      ? 'Dit product staat in de database, maar zonder voedingswaarden.'
      : 'Dit product staat nog niet in de database.';

  return (
    <Screen footer={<PrimaryButton label="Opslaan en toevoegen" onPress={save} disabled={!!error || busy} />}>
      <Row style={{ gap: 12, paddingTop: 8 }}>
        <IconButton icon="back" label="Terug" onPress={() => router.back()} />
        <Muted>{p.code ? `Barcode ${p.code}` : 'Eigen product'}</Muted>
      </Row>

      <View style={{ gap: 6 }}>
        <Title style={{ fontSize: 26, lineHeight: 30 }}>Product toevoegen</Title>
        <Muted style={{ fontSize: 15 }}>
          {intro} Vul het één keer in, daarna vindt Licht het altijd meteen terug bij het scannen.
        </Muted>
      </View>

      {apiKey ? (
        <Card style={{ gap: 10, borderWidth: 2, borderColor: C.greenSoft }}>
          <Strong>Snelst: fotografeer het etiket</Strong>
          <Muted style={{ fontSize: 13 }}>Neem de voedingswaardetabel op de verpakking, recht en van dichtbij.</Muted>
          <PrimaryButton label="Foto van het etiket" onPress={photoLabel} loading={busy} />
        </Card>
      ) : (
        <View style={{ backgroundColor: C.blueSoft, borderRadius: 14, padding: 12, gap: 4 }}>
          <Body style={{ fontSize: 13, color: C.blueText }}>
            Neem de waarden per 100 g over van de voedingswaardetabel op de verpakking. Met een Claude-sleutel kan de app het
            etiket ook zelf lezen van een foto.
          </Body>
          <Pressable onPress={() => router.push('/instellingen')} accessibilityRole="link" hitSlop={6}>
            <Text style={{ fontFamily: F.semi, fontSize: 13, color: C.blue }}>Sleutel instellen</Text>
          </Pressable>
        </View>
      )}

      {note ? (
        <View style={{ backgroundColor: C.greenSoft, borderRadius: 14, padding: 12 }}>
          <Body style={{ fontSize: 13, color: C.greenText }}>{note}</Body>
        </View>
      ) : null}

      <Field label="Naam" value={name} onChange={setName} numeric={false} placeholder="bv. Volkoren toastbrood" />

      <View style={{ gap: 8 }}>
        <Strong>Per 100 g (of 100 ml)</Strong>
        <Field label="Energie" value={kcal} onChange={setKcal} unit="kcal" placeholder="verplicht" />
        <Grid cols={2} gap={8}>
          {[
            <Field key="p" label="Eiwitten" value={protein} onChange={setProtein} unit="g" />,
            <Field key="c" label="Koolhydraten" value={carbs} onChange={setCarbs} unit="g" />,
            <Field key="f" label="Vetten" value={fat} onChange={setFat} unit="g" />,
            <Field key="v" label="Vezels" value={fiber} onChange={setFiber} unit="g" />,
          ]}
        </Grid>
        <Muted style={{ fontSize: 12 }}>Staat er alleen kJ? Deel door 4,184 voor kcal.</Muted>
      </View>

      <Field label="Eén portie is (optioneel)" value={portion} onChange={setPortion} unit="g" placeholder="bv. 35" />

      {error && (kcal || name) ? <Muted style={{ color: C.warn, fontSize: 13 }}>{error}</Muted> : null}
      <TextButton label="Annuleren" onPress={() => router.back()} color={C.muted} />
    </Screen>
  );
}

const st = StyleSheet.create({
  field: { backgroundColor: C.card, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, gap: 2 },
  label: { fontFamily: F.body, fontSize: 13, color: C.muted },
  input: { flex: 1, fontFamily: F.semi, fontSize: 18, color: C.ink, paddingVertical: 4, minHeight: 36 },
});
