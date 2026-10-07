import { router } from 'expo-router';
import { View } from 'react-native';

import { Habit, MealsPerDay, Sleep } from '@/calc';
import { useStore } from '@/store';
import { Grid, Muted, OnboardingHeader, Pill, PrimaryButton, Screen, Strong, Title, Wrap } from '@/ui';

const HABITS: { id: Habit; label: string }[] = [
  { id: 'avond', label: 'Snoepen ’s avonds' },
  { id: 'porties', label: 'Grote porties' },
  { id: 'frisdrank', label: 'Frisdrank' },
  { id: 'alcohol', label: 'Alcohol' },
  { id: 'onregelmatig', label: 'Onregelmatig eten' },
  { id: 'buiten', label: 'Vaak buitenshuis eten' },
  { id: 'stress', label: 'Eten bij stress' },
  { id: 'tijd', label: 'Weinig tijd om te koken' },
];

const MEALS: { id: MealsPerDay; label: string }[] = [
  { id: '2', label: '2' },
  { id: '3', label: '3' },
  { id: '4', label: '4' },
  { id: '5', label: '5+' },
];

const SLEEP: { id: Sleep; label: string }[] = [
  { id: 'goed', label: 'Goed' },
  { id: 'wisselend', label: 'Wisselend' },
  { id: 'slecht', label: 'Slecht' },
];

export default function Gewoontes() {
  const answers = useStore((s) => s.answers);
  const setAnswers = useStore((s) => s.setAnswers);

  const toggle = (h: Habit) =>
    setAnswers({ habits: answers.habits.includes(h) ? answers.habits.filter((x) => x !== h) : [...answers.habits, h] });

  return (
    <Screen footer={<PrimaryButton label="Maak mijn plan" onPress={() => router.push('/onboarding/plan')} />}>
      <OnboardingHeader step={4} />
      <View style={{ gap: 6 }}>
        <Title>Wat maakt het voor jou moeilijk?</Title>
        <Muted style={{ fontSize: 15 }}>Zo richten we de tips op wat bij jou het meeste verschil maakt.</Muted>
      </View>

      <Wrap>
        {HABITS.map((h) => (
          <Pill key={h.id} round multi label={h.label} selected={answers.habits.includes(h.id)} onPress={() => toggle(h.id)} />
        ))}
      </Wrap>

      <View style={{ gap: 10 }}>
        <Strong>Hoeveel keer eet je meestal per dag?</Strong>
        <Grid cols={4} gap={8}>
          {MEALS.map((m) => (
            <Pill key={m.id} label={m.label} selected={answers.meals === m.id} onPress={() => setAnswers({ meals: m.id })} />
          ))}
        </Grid>
      </View>

      <View style={{ gap: 10 }}>
        <Strong>Hoe slaap je meestal?</Strong>
        <Grid cols={3} gap={8}>
          {SLEEP.map((s) => (
            <Pill key={s.id} label={s.label} selected={answers.sleep === s.id} onPress={() => setAnswers({ sleep: s.id })} />
          ))}
        </Grid>
      </View>
    </Screen>
  );
}
