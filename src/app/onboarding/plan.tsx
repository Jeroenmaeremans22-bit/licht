import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import {
  activityLabel,
  dailyBudget,
  fmt,
  fmt1,
  stepRamp,
  tipsFor,
  weeksToGoal,
} from '@/calc';
import { connectHealth, hcStatus } from '@/health';
import { useStore } from '@/store';
import { C, F } from '@/theme';
import { Body, Card, Grid, H2, Muted, Pill, PrimaryButton, Row, Screen, Strong, TextButton, Title } from '@/ui';

const PACES = [0.25, 0.5, 0.75];

export default function Plan() {
  const s = useStore();
  const { profile, answers, pace, healthConnected } = s;
  const [busy, setBusy] = useState(false);

  const b = dailyBudget(profile, answers, pace, profile.weight, healthConnected);
  const weeks = weeksToGoal(profile.weight, profile.target, pace);
  const ramp = stepRamp(answers);
  const tips = tipsFor(answers);
  const maxRamp = Math.max(...ramp);

  const connect = async () => {
    setBusy(true);
    try {
      const status = await hcStatus();
      if (status !== 'available') {
        Alert.alert(
          'Health Connect niet gevonden',
          status === 'update'
            ? 'Werk Health Connect bij via de Play Store en probeer opnieuw.'
            : 'Installeer Health Connect via de Play Store (op Android 14 en nieuwer zit het al in je instellingen).',
        );
        return;
      }
      const ok = await connectHealth();
      s.setHealthConnected(ok);
      if (!ok) Alert.alert('Geen toegang', 'Zonder toegang tot je stappen kan de app je beweging niet meten. Je kan dit later nog koppelen bij Beweging.');
    } catch (e) {
      Alert.alert('Koppelen mislukt', String(e));
    } finally {
      setBusy(false);
    }
  };

  const start = () => {
    s.finishOnboarding();
    router.dismissAll();
    router.replace('/vandaag');
  };

  return (
    <Screen
      footer={
        <>
          <PrimaryButton label="Start" onPress={start} />
          <TextButton label="Antwoorden aanpassen" onPress={() => router.back()} />
        </>
      }>
      <View style={{ gap: 6, paddingTop: 8 }}>
        <Strong style={{ color: C.green, fontSize: 14 }}>Je plan is klaar</Strong>
        <Title>Jouw aanpak{profile.name ? `, ${profile.name}` : ''}</Title>
      </View>

      <View style={{ backgroundColor: C.dark, borderRadius: 24, padding: 20, gap: 14 }}>
        <View style={{ gap: 2 }}>
          <Muted style={{ color: C.darkMuted }}>Dagbudget</Muted>
          <Body style={{ fontFamily: F.display, fontSize: 44, lineHeight: 48, color: '#fff' }}>
            {fmt(b.budget)} <Body style={{ fontFamily: F.semi, fontSize: 18, color: '#fff' }}>kcal</Body>
          </Body>
          <Muted style={{ color: C.darkMuted, fontSize: 13 }}>
            ± {fmt1(pace)} kg per week · doel {fmt1(profile.target)} kg in ± {weeks} weken
          </Muted>
        </View>
        <Grid cols={2}>
          {[
            <View key="a">
              <Muted style={{ color: C.darkMuted, fontSize: 12 }}>Activiteitsniveau</Muted>
              <Strong style={{ color: '#fff' }}>{activityLabel(answers)}</Strong>
            </View>,
            <View key="m">
              <Muted style={{ color: C.darkMuted, fontSize: 12 }}>Onderhoud</Muted>
              <Strong style={{ color: '#fff' }}>± {fmt(b.maintenance)} kcal</Strong>
            </View>,
          ]}
        </Grid>
        {b.floored ? (
          <Muted style={{ color: C.darkMuted, fontSize: 12 }}>
            Je budget staat op het veilige minimum. Daardoor val je wellicht iets trager af dan het gekozen tempo.
          </Muted>
        ) : null}
        <Muted style={{ color: C.darkMuted, fontSize: 12 }}>
          {healthConnected
            ? 'Beweging die je gsm of horloge meet, komt er elke dag bij (voor 75%, want trackers schatten vaak wat te hoog).'
            : 'Je sport zit al in dit budget. Koppel Health Connect om je echte beweging elke dag mee te tellen.'}
        </Muted>
      </View>

      <View style={{ gap: 10 }}>
        <Strong>Tempo</Strong>
        <Grid cols={3} gap={8}>
          {PACES.map((p) => (
            <Pill key={p} label={`${fmt1(p)} kg/w`} selected={pace === p} onPress={() => s.setPace(p)} />
          ))}
        </Grid>
      </View>

      <View style={{ backgroundColor: C.blueSoft, borderRadius: 20, padding: 16, gap: 10 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Strong>Stapdoel</Strong>
          <Muted style={{ fontSize: 13, color: C.blueText }}>rustig opbouwen</Muted>
        </Row>
        <Row style={{ gap: 6, alignItems: 'flex-end' }}>
          {ramp.map((v, i) => (
            <View key={v} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <View
                style={{
                  width: '100%',
                  height: 20 + (v / maxRamp) * 32,
                  borderRadius: 6,
                  backgroundColor: i === 0 ? C.blue : C.blueLine,
                }}
              />
              <Muted style={{ fontSize: 12, color: C.blueText }}>{fmt(v)}</Muted>
            </View>
          ))}
        </Row>
        <Muted style={{ fontSize: 13, color: C.blueText }}>
          {ramp.length > 1
            ? 'Elke twee weken 500 stappen meer, zodat het haalbaar blijft.'
            : 'Je zet al veel stappen. Hou dat vast!'}
        </Muted>
      </View>

      <View style={{ gap: 10 }}>
        <H2>Waar jij het meest mee wint</H2>
        {tips.map((t, i) => (
          <Card key={t.title} style={{ flexDirection: 'row', gap: 12, padding: 16, borderRadius: 18 }}>
            <Body style={{ fontFamily: F.display, fontSize: 18, color: C.green, width: 18 }}>{i + 1}</Body>
            <View style={{ flex: 1, gap: 2 }}>
              <Strong>{t.title}</Strong>
              <Muted style={{ fontSize: 13 }}>{t.text}</Muted>
            </View>
          </Card>
        ))}
      </View>

      <Card style={{ borderWidth: 2, borderColor: C.blueLine, gap: 12 }}>
        <View style={{ gap: 2 }}>
          <Strong>{healthConnected ? 'Beweging wordt gemeten' : 'Beweging automatisch meten'}</Strong>
          <Muted style={{ fontSize: 13 }}>
            {healthConnected
              ? 'Health Connect is gekoppeld. Je stappen en activiteit komen er vanzelf in.'
              : 'Geef toegang tot stappen en activiteit via Health Connect. Werkt met je gsm en met de meeste smartwatches.'}
          </Muted>
        </View>
        {healthConnected ? null : (
          <PrimaryButton label="Koppel Health Connect" onPress={connect} loading={busy} color={C.blue} />
        )}
      </Card>
    </Screen>
  );
}
