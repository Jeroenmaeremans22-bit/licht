import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fmt, fmt1, greeting, longDate, todayKey } from '@/calc';
import { useTodayActivity } from '@/health';
import { MEALS, useStore } from '@/store';
import { useTodaySummary } from '@/summary';
import { C, F } from '@/theme';
import { Bar, Body, Card, Grid, H2, Icon, Muted, Ring, Row, Screen, Strong, Title } from '@/ui';

function weekChange(weights: { date: string; kg: number }[]): number | null {
  if (weights.length < 2) return null;
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const last = sorted[sorted.length - 1];
  const weekAgo = todayKey(new Date(Date.now() - 7 * 86400000));
  const before = [...sorted].reverse().find((w) => w.date <= weekAgo) ?? sorted[0];
  if (before === last) return null;
  return last.kg - before.kg;
}

export default function Vandaag() {
  const { connected, data } = useTodayActivity();
  const sum = useTodaySummary(data.activeKcal);
  const name = useStore((s) => s.profile.name);
  const weights = useStore((s) => s.weights);
  const removeEntry = useStore((s) => s.removeEntry);
  const lastDeleted = useStore((s) => s.lastDeleted);
  const restoreEntry = useStore((s) => s.restoreEntry);
  const clearLastDeleted = useStore((s) => s.clearLastDeleted);
  const change = weekChange(weights);
  const over = sum.remaining < 0;

  // De "ongedaan maken"-balk verdwijnt na 6 seconden.
  useEffect(() => {
    if (!lastDeleted) return;
    const t = setTimeout(clearLastDeleted, 6000);
    return () => clearTimeout(t);
  }, [lastDeleted, clearLastDeleted]);

  const undoBar = lastDeleted ? (
    <View style={st.undo}>
      <Text style={st.undoText} numberOfLines={1}>
        {lastDeleted.name} verwijderd
      </Text>
      <Pressable accessibilityRole="button" onPress={() => restoreEntry(lastDeleted)} style={st.undoBtn} hitSlop={6}>
        <Text style={[st.undoText, { flex: 0, fontFamily: F.bold, color: C.cameraAccent }]}>Ongedaan maken</Text>
      </Pressable>
    </View>
  ) : undefined;

  return (
    <Screen footer={undoBar}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 8 }}>
        <View style={{ gap: 2, flex: 1 }}>
          <Muted>{longDate()}</Muted>
          <Title>
            {greeting()}
            {name ? `, ${name}` : ''}
          </Title>
        </View>
        <Pressable onPress={() => router.navigate('/doel')} accessibilityRole="button" accessibilityLabel="Gewicht bekijken">
          <Muted style={{ textAlign: 'right', fontSize: 13 }}>{fmt1(sum.weight)} kg</Muted>
          {change !== null ? (
            <Strong style={{ fontSize: 13, textAlign: 'right', color: change <= 0 ? C.green : C.muted }}>
              {change <= 0 ? '−' : '+'}
              {fmt1(Math.abs(change))} deze week
            </Strong>
          ) : null}
        </Pressable>
      </Row>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <Ring value={sum.total > 0 ? sum.eaten / sum.total : 0}>
          <Body style={[st.big, over ? { color: C.warn } : null]}>{fmt(Math.abs(sum.remaining))}</Body>
          <Muted style={{ fontSize: 13 }}>{over ? 'kcal te veel' : 'kcal over'}</Muted>
        </Ring>
        <View style={{ flex: 1, gap: 12 }}>
          <View>
            <Muted style={{ fontSize: 12 }}>Dagbudget</Muted>
            <Strong style={{ fontSize: 17 }}>{fmt(sum.budget)} kcal</Strong>
          </View>
          <View>
            <Muted style={{ fontSize: 12 }}>Gegeten</Muted>
            <Strong style={{ fontSize: 17 }}>− {fmt(sum.eaten)}</Strong>
          </View>
          <View>
            <Muted style={{ fontSize: 12 }}>Beweging</Muted>
            <Strong style={{ fontSize: 17, color: C.blue }}>{connected ? `+ ${fmt(sum.movement)}` : 'niet gekoppeld'}</Strong>
          </View>
        </View>
      </Card>

      <Grid cols={3}>
        {[
          ['Eiwit', sum.eatenMacros.protein, sum.macros.protein],
          ['Koolhydr.', sum.eatenMacros.carbs, sum.macros.carbs],
          ['Vet', sum.eatenMacros.fat, sum.macros.fat],
        ].map(([label, eaten, goal]) => (
          <Card key={label as string} style={{ padding: 14, gap: 8, borderRadius: 18 }}>
            <Muted style={{ fontSize: 12 }}>{label}</Muted>
            <Strong>
              {Math.round(eaten as number)} <Muted style={{ fontSize: 13 }}>/ {goal} g</Muted>
            </Strong>
            <Bar value={(eaten as number) / (goal as number)} />
          </Card>
        ))}
      </Grid>

      <Pressable
        onPress={() => router.navigate('/beweging')}
        accessibilityRole="button"
        style={{ backgroundColor: C.blueSoft, borderRadius: 20, padding: 16, flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        <View style={st.blueIcon}>
          <Icon name="activity" color="#fff" size={22} stroke={2} />
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Strong>{connected ? `${fmt(data.steps)} stappen` : 'Beweging koppelen'}</Strong>
            <Muted style={{ fontSize: 13, color: C.blueText }}>doel {fmt(sum.stepGoal)}</Muted>
          </Row>
          <Bar value={connected ? data.steps / sum.stepGoal : 0} color={C.blue} track={C.blueLine} />
          <Muted style={{ fontSize: 12, color: C.blueText }}>
            {connected ? 'Gemeten via Health Connect' : 'Tik om Health Connect te koppelen'}
          </Muted>
        </View>
      </Pressable>

      {sum.reserve > 0 && !over ? (
        <View style={{ backgroundColor: C.greenSoft, borderRadius: 16, padding: 14 }}>
          <Body style={{ fontSize: 14, color: C.greenText }}>
            Er staat {sum.reserve} kcal van je budget klaar voor een snack vanavond.
          </Body>
        </View>
      ) : null}

      <View style={{ gap: 10 }}>
        <H2 style={{ marginTop: 4 }}>Maaltijden</H2>
        {MEALS.map((m) => {
          const items = sum.todays.filter((e) => e.meal === m.id);
          const total = items.reduce((s, e) => s + e.kcal, 0);
          return (
            <Card key={m.id} style={{ padding: 0, borderRadius: 18, overflow: 'hidden' }}>
              <Row style={{ justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: items.length ? 6 : 14 }}>
                <View style={{ flex: 1 }}>
                  <Strong>{m.label}</Strong>
                  {items.length === 0 ? <Muted style={{ fontSize: 13 }}>Nog niets toegevoegd</Muted> : null}
                </View>
                {total > 0 ? <Strong style={{ marginRight: 10 }}>{fmt(total)} kcal</Strong> : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Toevoegen aan ${m.label.toLowerCase()}`}
                  onPress={() => router.push({ pathname: '/scan', params: { meal: m.id } })}
                  style={st.add}>
                  <Icon name="plus" color={C.green} size={20} stroke={2.2} />
                </Pressable>
              </Row>
              {items.map((e) => (
                <View key={e.id} style={st.entry}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityHint="Tik om de hoeveelheid of maaltijd aan te passen"
                    onPress={() => router.push({ pathname: '/item', params: { id: e.id } })}
                    style={st.entryMain}>
                    <View style={{ flex: 1 }}>
                      <Body style={{ fontSize: 14 }} numberOfLines={2}>
                        {e.name}
                      </Body>
                      {e.grams !== undefined ? <Muted style={{ fontSize: 12 }}>{Math.round(e.grams)} g</Muted> : null}
                    </View>
                    <Muted style={{ fontSize: 14 }}>{fmt(e.kcal)}</Muted>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${e.name} verwijderen`}
                    onPress={() => removeEntry(e.id)}
                    style={st.trash}>
                    <Icon name="trash" color={C.muted} size={20} />
                  </Pressable>
                </View>
              ))}
              {items.length ? <View style={{ height: 8 }} /> : null}
            </Card>
          );
        })}
        <Muted style={{ fontSize: 12, textAlign: 'center' }}>Tik op een item om het aan te passen.</Muted>
      </View>
    </Screen>
  );
}

const st = StyleSheet.create({
  big: { fontFamily: F.display, fontSize: 34, lineHeight: 38, letterSpacing: -1 },
  blueIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  add: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.greenSoft, alignItems: 'center', justifyContent: 'center' },
  entry: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 6, borderTopWidth: 1, borderTopColor: C.bg },
  entryMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingVertical: 6 },
  trash: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  undo: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.dark, borderRadius: 16, paddingLeft: 16, paddingRight: 6, minHeight: 52 },
  undoText: { flex: 1, fontFamily: F.body, fontSize: 14, color: '#fff' },
  undoBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 10 },
});
