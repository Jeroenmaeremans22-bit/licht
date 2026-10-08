import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { fmt, fmt1 } from '@/calc';
import { useTodayActivity } from '@/health';
import { FoodItem, itemTotals, Meal, MEALS, mealForNow, useStore } from '@/store';
import { useTodaySummary } from '@/summary';
import { C, F } from '@/theme';
import { Body, Card, Grid, IconButton, Muted, Pill, PrimaryButton, Row, Screen, Stepper, Strong, Title } from '@/ui';

const SOURCE_LABEL = {
  barcode: 'Barcode herkend',
  foto: 'Ingeschat van je foto',
  zoeken: 'Uit de database',
  schatting: 'Ingeschat uit je omschrijving',
  eigen: 'Je eigen product',
} as const;

function amountLabel(i: FoodItem): string {
  if (i.servingLabel && i.step > 10) {
    const n = i.grams / i.step;
    if (Math.abs(n - Math.round(n)) < 0.01) return `${Math.round(n)}×`;
  }
  return `${Math.round(i.grams)} g`;
}

export default function Product() {
  const params = useLocalSearchParams<{ meal?: string }>();
  const pending = useStore((s) => s.pending);
  const addEntries = useStore((s) => s.addEntries);
  const { data } = useTodayActivity();
  const sum = useTodaySummary(data.activeKcal);

  const [items, setItems] = useState<FoodItem[]>(pending?.items ?? []);
  const [meal, setMeal] = useState<Meal>(
    MEALS.some((m) => m.id === params.meal) ? (params.meal as Meal) : mealForNow(),
  );

  if (!pending) {
    return (
      <Screen>
        <IconButton icon="back" label="Terug" onPress={() => router.back()} />
        <Muted>Niets om toe te voegen.</Muted>
      </Screen>
    );
  }

  const change = (idx: number, dir: 1 | -1) =>
    setItems((list) =>
      list.map((it, i) => (i === idx ? { ...it, grams: Math.max(0, Math.min(3000, it.grams + dir * it.step)) } : it)),
    );

  const totals = items.map(itemTotals).reduce(
    (a, t) => ({
      kcal: a.kcal + t.kcal,
      protein: a.protein + t.protein,
      carbs: a.carbs + t.carbs,
      fat: a.fat + t.fat,
      fiber: a.fiber + t.fiber,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );
  const after = sum.remaining - totals.kcal;
  const single = items.length === 1 ? items[0] : null;
  const mealLabel = MEALS.find((m) => m.id === meal)!.label.toLowerCase();

  const add = () => {
    addEntries(meal, items);
    useStore.getState().setPending(null);
    router.back();
  };

  return (
    <Screen
      footer={<PrimaryButton label={`Toevoegen aan ${mealLabel}`} onPress={add} disabled={totals.kcal <= 0} />}>
      <Row style={{ gap: 12, paddingTop: 8 }}>
        <IconButton icon="back" label="Terug" onPress={() => router.back()} />
        <Muted>{SOURCE_LABEL[pending.source]}</Muted>
      </Row>

      {single ? (
        <Row style={{ gap: 14 }}>
          {single.imageUrl ? (
            <Image source={{ uri: single.imageUrl }} style={{ width: 72, height: 72, borderRadius: 18, backgroundColor: C.line }} contentFit="cover" />
          ) : null}
          <View style={{ flex: 1, gap: 2 }}>
            <Title style={{ fontSize: 24, lineHeight: 28 }}>{single.name}</Title>
            <Muted>
              {[single.brand, single.servingLabel ?? `${fmt(single.per100.kcal)} kcal per 100 g`].filter(Boolean).join(' · ')}
            </Muted>
          </View>
        </Row>
      ) : (
        <Title style={{ fontSize: 24, lineHeight: 28 }}>Op je bord</Title>
      )}

      {pending.note ? (
        <View style={{ backgroundColor: C.blueSoft, borderRadius: 14, padding: 12 }}>
          <Body style={{ fontSize: 13, color: C.blueText }}>{pending.note}</Body>
        </View>
      ) : null}

      <Card style={{ gap: 16 }}>
        {items.map((it, i) => (
          <Row key={`${it.name}-${i}`} style={{ justifyContent: 'space-between', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Strong numberOfLines={2}>{single ? (it.servingLabel ? 'Aantal porties' : 'Hoeveelheid') : it.name}</Strong>
              <Muted style={{ fontSize: 13 }}>
                {fmt(itemTotals(it).kcal)} kcal{single && it.servingLabel ? ` · ${Math.round(it.grams)} g` : ''}
              </Muted>
            </View>
            <Stepper label={it.name} value={amountLabel(it)} onMinus={() => change(i, -1)} onPlus={() => change(i, 1)} />
          </Row>
        ))}
        <View style={{ borderTopWidth: 1, borderTopColor: C.line, paddingTop: 14, flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Body style={{ fontFamily: F.display, fontSize: 44, lineHeight: 48, letterSpacing: -1 }}>{fmt(totals.kcal)}</Body>
          <Muted style={{ fontSize: 16 }}>kcal</Muted>
        </View>
        <Grid cols={4} gap={8}>
          {[
            ['Eiwit', totals.protein],
            ['Koolh.', totals.carbs],
            ['Vet', totals.fat],
            ['Vezels', totals.fiber],
          ].map(([l, v]) => (
            <View key={l as string} style={{ backgroundColor: C.bg, borderRadius: 14, padding: 10, gap: 2 }}>
              <Muted style={{ fontSize: 12 }}>{l}</Muted>
              <Strong>{fmt1(v as number)} g</Strong>
            </View>
          ))}
        </Grid>
      </Card>

      <View style={{ gap: 10 }}>
        <Strong>Bij welke maaltijd?</Strong>
        <Grid cols={2} gap={8}>
          {MEALS.map((m) => (
            <Pill key={m.id} label={m.label} selected={meal === m.id} onPress={() => setMeal(m.id)} />
          ))}
        </Grid>
      </View>

      <Row style={{ backgroundColor: after < 0 ? C.warnSoft : C.greenSoft, borderRadius: 18, padding: 16, justifyContent: 'space-between' }}>
        <Body style={{ fontSize: 14, color: after < 0 ? C.warn : C.greenText }}>
          {after < 0 ? 'Na toevoegen ben je erover' : 'Na toevoegen nog over'}
        </Body>
        <Strong style={{ color: after < 0 ? C.warn : C.greenDark, fontFamily: F.bold }}>{fmt(Math.abs(after))} kcal</Strong>
      </Row>
    </Screen>
  );
}
