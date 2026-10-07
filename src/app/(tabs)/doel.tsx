import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { dailyBudget, fmt, fmt1, weeksToGoal } from '@/calc';
import { currentWeight, useStore } from '@/store';
import { C, F } from '@/theme';
import { Body, Card, Choice, Grid, H2, Muted, NumberField, PrimaryButton, Row, Screen, Strong, TextButton, Title } from '@/ui';

const PACES = [
  { v: 0.25, label: 'Rustig', sub: 'Makkelijk vol te houden' },
  { v: 0.5, label: 'Aanbevolen', sub: 'Goede balans' },
  { v: 0.75, label: 'Sneller', sub: 'Vraagt meer discipline' },
];

const toNum = (v: string) => parseFloat(v.replace(',', '.'));

export default function Doel() {
  const s = useStore();
  const weight = currentWeight(s);
  const [newWeight, setNewWeight] = useState(String(weight).replace('.', ','));
  const [target, setTarget] = useState(String(s.profile.target).replace('.', ','));

  const b = dailyBudget(s.profile, s.answers, s.pace, weight, s.healthConnected);
  const weeks = weeksToGoal(weight, s.profile.target, s.pace);
  const lost = s.profile.weight - weight;
  const history = [...s.weights].sort((a, c) => c.date.localeCompare(a.date)).slice(0, 6);

  const saveWeight = () => {
    const kg = toNum(newWeight);
    if (!(kg >= 35 && kg <= 300)) return Alert.alert('Ongeldig gewicht', 'Vul je gewicht in kilogram in.');
    s.logWeight(Math.round(kg * 10) / 10);
  };

  const saveTarget = (v: string) => {
    setTarget(v);
    const t = toNum(v);
    const h = s.profile.height / 100;
    if (t >= 35 && t < weight && t / (h * h) >= 18.5) s.setProfile({ target: t });
  };

  const restart = () => router.push('/onboarding');

  return (
    <Screen>
      <View style={{ gap: 4, paddingTop: 8 }}>
        <Title>Je doel</Title>
        <Muted style={{ fontSize: 15 }}>
          {lost > 0 ? `Al ${fmt1(lost)} kg kwijt sinds de start. ` : ''}
          {weeks > 0 ? `Nog ${fmt1(weight - s.profile.target)} kg te gaan.` : 'Doel bereikt!'}
        </Muted>
      </View>

      <Card style={{ gap: 12 }}>
        <Strong>Gewicht van vandaag</Strong>
        <Row style={{ gap: 10 }}>
          <View style={{ flex: 1 }}>
            <NumberField label="Weegschaal" value={newWeight} onChange={setNewWeight} unit="kg" />
          </View>
          <View style={{ width: 120 }}>
            <PrimaryButton label="Opslaan" onPress={saveWeight} />
          </View>
        </Row>
        <Muted style={{ fontSize: 13 }}>Weeg je liefst ’s ochtends, na het toilet en voor het ontbijt. Schommelingen van een kilo zijn normaal.</Muted>
        {history.length > 1 ? (
          <View style={{ gap: 4 }}>
            {history.map((w) => (
              <Row key={w.date} style={{ justifyContent: 'space-between' }}>
                <Muted style={{ fontSize: 13 }}>{w.date.split('-').reverse().join('/')}</Muted>
                <Muted style={{ fontSize: 13 }}>{fmt1(w.kg)} kg</Muted>
              </Row>
            ))}
          </View>
        ) : null}
      </Card>

      <Grid cols={2}>
        {[
          <Card key="n" style={{ padding: 14, gap: 6, borderRadius: 18 }}>
            <Muted style={{ fontSize: 13 }}>Huidig gewicht</Muted>
            <Body style={{ fontFamily: F.display, fontSize: 26 }}>{fmt1(weight)} kg</Body>
          </Card>,
          <NumberField key="t" label="Doelgewicht" value={target} onChange={saveTarget} unit="kg" accent />,
        ]}
      </Grid>

      <View style={{ gap: 8 }}>
        <Strong>Tempo</Strong>
        {PACES.map((p) => (
          <Choice
            key={p.v}
            label={p.label}
            sub={p.sub}
            right={`${fmt1(p.v)} kg/week`}
            selected={s.pace === p.v}
            onPress={() => s.setPace(p.v)}
          />
        ))}
      </View>

      <View style={{ backgroundColor: C.dark, borderRadius: 24, padding: 20, gap: 14 }}>
        <View>
          <Muted style={{ color: C.darkMuted }}>Jouw dagbudget</Muted>
          <Body style={{ fontFamily: F.display, fontSize: 44, lineHeight: 48, color: '#fff' }}>
            {fmt(b.budget)} <Body style={{ fontFamily: F.semi, fontSize: 18, color: '#fff' }}>kcal</Body>
          </Body>
        </View>
        <Grid cols={2}>
          {[
            <View key="a">
              <Muted style={{ color: C.darkMuted, fontSize: 12 }}>Af te vallen</Muted>
              <Strong style={{ color: '#fff' }}>{fmt1(Math.max(0, weight - s.profile.target))} kg</Strong>
            </View>,
            <View key="d">
              <Muted style={{ color: C.darkMuted, fontSize: 12 }}>Duur</Muted>
              <Strong style={{ color: '#fff' }}>± {weeks} weken</Strong>
            </View>,
          ]}
        </Grid>
        <Muted style={{ color: C.darkMuted, fontSize: 12 }}>
          Onderhoud ± {fmt(b.maintenance)} kcal, berekend uit je leeftijd, lengte, gewicht en activiteit.
          {s.healthConnected ? ' Gemeten beweging komt er elke dag bij.' : ''}
          {b.floored ? ' Je budget staat op het veilige minimum.' : ' Het budget zakt nooit onder een veilig minimum.'}
        </Muted>
      </View>

      <View style={{ gap: 4 }}>
        <H2 style={{ fontSize: 18 }}>Meer</H2>
        <TextButton label="Vragen opnieuw invullen" onPress={restart} />
        <TextButton label="Instellingen" onPress={() => router.push('/instellingen')} />
      </View>
    </Screen>
  );
}
