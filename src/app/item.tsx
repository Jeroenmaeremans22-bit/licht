import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { fmt, fmt1 } from '@/calc';
import { Meal, MEALS, useStore } from '@/store';
import { C, F } from '@/theme';
import { Body, Card, Grid, IconButton, Muted, Pill, PrimaryButton, Row, Screen, Stepper, Strong, TextButton, Title } from '@/ui';

export default function Item() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entry = useStore((s) => s.entries.find((e) => e.id === id));
  const updateEntry = useStore((s) => s.updateEntry);
  const removeEntry = useStore((s) => s.removeEntry);

  const [grams, setGrams] = useState(entry?.grams ?? 0);
  const [meal, setMeal] = useState<Meal>(entry?.meal ?? 'ontbijt');

  if (!entry) {
    return (
      <Screen>
        <IconButton icon="back" label="Terug" onPress={() => router.back()} />
        <Muted>Dit item bestaat niet meer.</Muted>
      </Screen>
    );
  }

  const editable = !!entry.per100 && entry.grams !== undefined;
  const step = entry.step && entry.step > 0 ? entry.step : 10;
  const f = grams / 100;
  const kcal = editable ? Math.round(entry.per100!.kcal * f) : entry.kcal;
  const protein = editable ? entry.per100!.protein * f : entry.protein;
  const carbs = editable ? entry.per100!.carbs * f : entry.carbs;
  const fat = editable ? entry.per100!.fat * f : entry.fat;

  const portions = step > 10 ? grams / step : null;
  const amount =
    portions !== null && Math.abs(portions - Math.round(portions)) < 0.01 ? `${Math.round(portions)}×` : `${Math.round(grams)} g`;

  const save = () => {
    updateEntry(entry.id, { meal, ...(editable ? { grams } : {}) });
    router.back();
  };

  const remove = () => {
    removeEntry(entry.id);
    router.back();
  };

  return (
    <Screen
      footer={
        <>
          <PrimaryButton label="Opslaan" onPress={save} disabled={editable && grams <= 0} />
          <TextButton label="Verwijderen uit je dagboek" onPress={remove} color={C.warn} />
        </>
      }>
      <Row style={{ gap: 12, paddingTop: 8 }}>
        <IconButton icon="back" label="Terug" onPress={() => router.back()} />
        <Muted>Aanpassen</Muted>
      </Row>

      <Title style={{ fontSize: 24, lineHeight: 28 }}>{entry.name}</Title>

      <Card style={{ gap: 16 }}>
        {editable ? (
          <Row style={{ justifyContent: 'space-between', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Strong>Hoeveelheid</Strong>
              {portions !== null ? <Muted style={{ fontSize: 13 }}>{Math.round(grams)} g</Muted> : null}
            </View>
            <Stepper
              label={entry.name}
              value={amount}
              onMinus={() => setGrams((g) => Math.max(0, g - step))}
              onPlus={() => setGrams((g) => Math.min(3000, g + step))}
            />
          </Row>
        ) : (
          <Muted style={{ fontSize: 13 }}>
            Dit item is toegevoegd met een oudere versie van de app, dus de hoeveelheid kan je niet aanpassen. Verwijder het en
            voeg het opnieuw toe als het niet klopt.
          </Muted>
        )}
        <View style={{ borderTopWidth: 1, borderTopColor: C.line, paddingTop: 14, flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Body style={{ fontFamily: F.display, fontSize: 44, lineHeight: 48, letterSpacing: -1 }}>{fmt(kcal)}</Body>
          <Muted style={{ fontSize: 16 }}>kcal</Muted>
        </View>
        <Grid cols={3} gap={8}>
          {[
            ['Eiwit', protein],
            ['Koolh.', carbs],
            ['Vet', fat],
          ].map(([l, v]) => (
            <View key={l as string} style={{ backgroundColor: C.bg, borderRadius: 14, padding: 10, gap: 2 }}>
              <Muted style={{ fontSize: 12 }}>{l}</Muted>
              <Strong>{fmt1(v as number)} g</Strong>
            </View>
          ))}
        </Grid>
      </Card>

      <View style={{ gap: 10 }}>
        <Strong>Maaltijd</Strong>
        <Grid cols={2} gap={8}>
          {MEALS.map((m) => (
            <Pill key={m.id} label={m.label} selected={meal === m.id} onPress={() => setMeal(m.id)} />
          ))}
        </Grid>
      </View>
    </Screen>
  );
}
