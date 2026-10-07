import { useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';

import { ACTIVE_SHARE, fmt, fmt1, shortDay } from '@/calc';
import { connectHealth, hcStatus, openHealthConnectSettings, useTodayActivity } from '@/health';
import { useStore } from '@/store';
import { useTodaySummary } from '@/summary';
import { C, F } from '@/theme';
import { Bar, Body, Card, Grid, H2, Muted, PrimaryButton, Row, Screen, Strong, TextButton, Title } from '@/ui';

export default function Beweging() {
  const { connected, data, week, loading, refresh } = useTodayActivity();
  const sum = useTodaySummary(data.activeKcal);
  const setConnected = useStore((s) => s.setHealthConnected);
  const [busy, setBusy] = useState(false);

  const connect = async () => {
    setBusy(true);
    try {
      const status = await hcStatus();
      if (status !== 'available') {
        Alert.alert(
          'Health Connect niet gevonden',
          status === 'update'
            ? 'Werk Health Connect bij via de Play Store en probeer opnieuw.'
            : 'Installeer Health Connect via de Play Store. Op Android 14 en nieuwer zit het in Instellingen › Beveiliging en privacy.',
        );
        return;
      }
      const ok = await connectHealth();
      setConnected(ok);
      if (ok) await refresh();
    } catch (e) {
      Alert.alert('Koppelen mislukt', String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!connected) {
    return (
      <Screen>
        <Title style={{ paddingTop: 8 }}>Beweging</Title>
        <Card style={{ gap: 14 }}>
          <H2>Meet je beweging automatisch</H2>
          <Body>
            Licht leest je stappen, actieve calorieën, afstand en trainingen uit Health Connect. Dat is de plek waar je gsm,
            smartwatch (Samsung, Fitbit, Garmin …) en sport-apps hun gegevens samenbrengen. Dubbels worden er automatisch
            uitgehaald.
          </Body>
          <Muted style={{ fontSize: 13 }}>
            Tip: zorg dat je stappenteller-app (bv. Samsung Health of Google Fit) ook naar Health Connect schrijft.
          </Muted>
          <PrimaryButton label="Koppel Health Connect" onPress={connect} loading={busy} color={C.blue} />
        </Card>
      </Screen>
    );
  }

  const maxWeek = Math.max(sum.stepGoal, ...week.map((w) => w.steps), 1);
  const avg = week.length ? Math.round(week.reduce((s, w) => s + w.steps, 0) / week.length) : 0;
  const left = Math.max(0, sum.stepGoal - data.steps);

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', paddingTop: 8 }}>
        <Title>Beweging</Title>
        {loading ? <ActivityIndicator color={C.blue} /> : <TextButton label="Vernieuwen" onPress={refresh} color={C.blue} />}
      </Row>

      <View style={{ backgroundColor: C.blue, borderRadius: 24, padding: 20, gap: 14 }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Muted style={{ color: '#D6E2F3' }}>Stappen vandaag</Muted>
            <Body style={{ fontFamily: F.display, fontSize: 48, lineHeight: 52, color: '#fff', letterSpacing: -1.5 }}>
              {fmt(data.steps)}
            </Body>
          </View>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Muted style={{ color: '#fff', fontSize: 13 }}>
              {Math.round((data.steps / sum.stepGoal) * 100)}% van {fmt(sum.stepGoal)}
            </Muted>
          </View>
        </Row>
        <Bar value={data.steps / sum.stepGoal} color="#fff" track="rgba(255,255,255,0.22)" height={10} />
        <Muted style={{ color: '#D6E2F3', fontSize: 13 }}>
          {left > 0
            ? `Nog ${fmt(left)} stappen · ongeveer ${Math.max(5, Math.round(left / 110 / 5) * 5)} minuten wandelen`
            : 'Stapdoel gehaald. Goed bezig!'}
        </Muted>
      </View>

      <Grid cols={3}>
        {[
          ['Actieve kcal', fmt(data.activeKcal)],
          ['Afstand', `${fmt1(data.distanceKm)} km`],
          ['Actief', `${data.exercises.reduce((s, e) => s + e.minutes, 0)} min`],
        ].map(([l, v]) => (
          <Card key={l} style={{ padding: 14, gap: 4, borderRadius: 18 }}>
            <Muted style={{ fontSize: 12 }}>{l}</Muted>
            <Strong style={{ fontSize: 19 }}>{v}</Strong>
          </Card>
        ))}
      </Grid>
      <Muted style={{ fontSize: 12, marginTop: -6 }}>
        Van je actieve calorieën komt {Math.round(ACTIVE_SHARE * 100)}% bij je dagbudget: + {fmt(sum.movement)} kcal vandaag.
      </Muted>

      <Card style={{ gap: 14 }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <H2 style={{ fontSize: 18 }}>Afgelopen 7 dagen</H2>
          <Muted style={{ fontSize: 13 }}>gem. {fmt(avg)}</Muted>
        </Row>
        <Row style={{ gap: 8, alignItems: 'flex-end', height: 140 }}>
          {week.map((w, i) => {
            const today = i === week.length - 1;
            return (
              <View key={w.date.toISOString()} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                <View
                  accessibilityLabel={`${shortDay(w.date)}: ${w.steps} stappen`}
                  style={{
                    width: '100%',
                    height: Math.max(4, (w.steps / maxWeek) * 110),
                    borderRadius: 8,
                    backgroundColor: today ? C.blue : w.steps >= sum.stepGoal ? C.blueMid : C.blueLine,
                  }}
                />
                <Muted style={{ fontSize: 12, color: today ? C.ink : C.muted, fontFamily: today ? F.bold : F.body }}>
                  {shortDay(w.date)}
                </Muted>
              </View>
            );
          })}
        </Row>
      </Card>

      <View style={{ gap: 10 }}>
        <H2 style={{ fontSize: 18 }}>Activiteiten vandaag</H2>
        {data.exercises.length === 0 ? (
          <Muted>Nog geen trainingen vandaag. Wandelingen en fietstochten die je horloge of gsm herkent, verschijnen hier.</Muted>
        ) : (
          data.exercises.map((e) => (
            <Card key={e.start} style={{ padding: 14, borderRadius: 18, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Strong>{e.name}</Strong>
              <Muted>{e.minutes} min</Muted>
            </Card>
          ))
        )}
      </View>

      <TextButton label="Gegevens beheren in Health Connect" onPress={openHealthConnectSettings} color={C.blue} />
    </Screen>
  );
}
