import { router } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Sex } from '@/calc';
import { currentWeight, useStore } from '@/store';
import { C, F } from '@/theme';
import { Body, Card, Grid, Muted, NumberField, OnboardingHeader, Pill, PrimaryButton, Screen, Strong, Title } from '@/ui';

const toNum = (v: string) => parseFloat(v.replace(',', '.'));

export default function OverJou() {
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const onboardedBefore = useStore((s) => s.weights.length > 0);
  const latestWeight = useStore((s) => currentWeight(s));

  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(String(profile.age));
  const [height, setHeight] = useState(String(profile.height));
  const [weight, setWeight] = useState(String(latestWeight).replace('.', ','));
  const [target, setTarget] = useState(String(profile.target));
  const [sex, setSex] = useState<Sex>(profile.sex);

  const a = toNum(age);
  const h = toNum(height);
  const w = toNum(weight);
  const t = toNum(target);
  let error = '';
  if (!(a >= 16 && a <= 100)) error = 'Vul een leeftijd in tussen 16 en 100.';
  else if (!(h >= 120 && h <= 230)) error = 'Vul je lengte in centimeter in.';
  else if (!(w >= 35 && w <= 300)) error = 'Vul je gewicht in kilogram in.';
  else if (!(t >= 35 && t <= 300)) error = 'Vul je doelgewicht in kilogram in.';
  else if (t >= w) error = 'Je doelgewicht moet lager zijn dan je huidige gewicht.';
  else if (t / ((h / 100) * (h / 100)) < 18.5)
    error = 'Dat doelgewicht is onder een gezond gewicht voor je lengte. Kies een iets hoger doel.';

  const next = () => {
    setProfile({ name: name.trim(), age: Math.round(a), height: Math.round(h), weight: w, target: t, sex });
    router.push('/onboarding/werk');
  };

  return (
    <Screen footer={<PrimaryButton label="Volgende" onPress={next} disabled={!!error} />}>
      <OnboardingHeader step={1} back={onboardedBefore} />
      <View style={{ gap: 6 }}>
        <Title>{onboardedBefore ? 'Even alles opnieuw overlopen' : 'Welkom! Eerst wat over jou'}</Title>
        <Muted style={{ fontSize: 15 }}>
          Met een paar vragen stellen we een aanpak op die bij jouw leven past. Het duurt ongeveer twee minuten.
        </Muted>
      </View>

      <Card style={{ padding: 14, gap: 6, borderRadius: 18 }}>
        <Muted style={{ fontSize: 13 }}>Hoe mogen we je noemen?</Muted>
        <TextInput
          accessibilityLabel="Voornaam"
          value={name}
          onChangeText={setName}
          placeholder="Voornaam"
          placeholderTextColor="#8A958E"
          style={{ fontFamily: F.display, fontSize: 24, color: C.ink, padding: 0 }}
          maxLength={30}
        />
      </Card>

      <Grid cols={2}>
        {[
          <NumberField key="a" label="Leeftijd" value={age} onChange={setAge} unit="jaar" />,
          <NumberField key="h" label="Lengte" value={height} onChange={setHeight} unit="cm" />,
          <NumberField key="w" label="Gewicht" value={weight} onChange={setWeight} unit="kg" />,
          <NumberField key="t" label="Doelgewicht" value={target} onChange={setTarget} unit="kg" accent />,
        ]}
      </Grid>

      <View style={{ gap: 10 }}>
        <View style={{ gap: 2 }}>
          <Strong>Lichaam</Strong>
          <Muted style={{ fontSize: 13 }}>Nodig om je verbruik in rust correct te berekenen.</Muted>
        </View>
        <Grid cols={2} gap={8}>
          {[
            <Pill key="m" label="Man" selected={sex === 'man'} onPress={() => setSex('man')} />,
            <Pill key="v" label="Vrouw" selected={sex === 'vrouw'} onPress={() => setSex('vrouw')} />,
          ]}
        </Grid>
      </View>

      {error ? (
        <View style={{ backgroundColor: C.warnSoft, borderRadius: 14, padding: 12 }}>
          <Body style={{ color: C.warn, fontSize: 14 }}>{error}</Body>
        </View>
      ) : null}
    </Screen>
  );
}
