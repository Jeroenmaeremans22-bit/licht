import { router } from 'expo-router';
import { View } from 'react-native';

import { SportFreq, StepsGuess } from '@/calc';
import { useStore } from '@/store';
import { C } from '@/theme';
import { Body, Choice, Grid, Muted, OnboardingHeader, Pill, PrimaryButton, Screen, Strong, Title, Wrap } from '@/ui';

const FREQS: { id: SportFreq; label: string }[] = [
  { id: '0', label: 'Niet' },
  { id: '1-2', label: '1–2×' },
  { id: '3-4', label: '3–4×' },
  { id: '5', label: '5×+' },
];

const SPORTS = ['Wandelen', 'Fietsen', 'Lopen', 'Fitness', 'Zwemmen', 'Teamsport', 'Iets anders'];

const STEPS: { id: StepsGuess; label: string }[] = [
  { id: 'laag', label: 'Minder dan 4.000' },
  { id: 'mid', label: '4.000 – 7.000' },
  { id: 'hoog', label: '7.000 – 10.000' },
  { id: 'top', label: 'Meer dan 10.000' },
  { id: 'weetniet', label: 'Weet ik niet' },
];

export default function Sport() {
  const answers = useStore((s) => s.answers);
  const setAnswers = useStore((s) => s.setAnswers);

  const toggleSport = (sport: string) =>
    setAnswers({
      sports: answers.sports.includes(sport) ? answers.sports.filter((x) => x !== sport) : [...answers.sports, sport],
    });

  return (
    <Screen footer={<PrimaryButton label="Volgende" onPress={() => router.push('/onboarding/gewoontes')} />}>
      <OnboardingHeader step={3} />
      <View style={{ gap: 6 }}>
        <Title>Hoeveel beweeg je nu?</Title>
        <Muted style={{ fontSize: 15 }}>Eerlijk antwoorden helpt: we bouwen op vanaf waar je nu staat.</Muted>
      </View>

      <View style={{ gap: 10 }}>
        <Strong>Hoe vaak sport je per week?</Strong>
        <Grid cols={4} gap={8}>
          {FREQS.map((f) => (
            <Pill key={f.id} label={f.label} selected={answers.freq === f.id} onPress={() => setAnswers({ freq: f.id })} />
          ))}
        </Grid>
      </View>

      <View style={{ gap: 10 }}>
        <View style={{ gap: 2 }}>
          <Strong>Wat doe je graag?</Strong>
          <Muted style={{ fontSize: 13 }}>Kies er zoveel je wilt.</Muted>
        </View>
        <Wrap>
          {SPORTS.map((sp) => (
            <Pill key={sp} round multi label={sp} selected={answers.sports.includes(sp)} onPress={() => toggleSport(sp)} />
          ))}
        </Wrap>
      </View>

      <View style={{ gap: 10 }}>
        <Strong>Hoeveel stappen zet je op een gewone dag?</Strong>
        <View style={{ gap: 8 }}>
          {STEPS.map((s) => (
            <Choice key={s.id} label={s.label} selected={answers.steps === s.id} onPress={() => setAnswers({ steps: s.id })} />
          ))}
        </View>
        <View style={{ backgroundColor: C.blueSoft, borderRadius: 14, padding: 12 }}>
          <Body style={{ fontSize: 13, color: C.blueText }}>
            Geen idee? Geen probleem. Na het koppelen met Health Connect meet de app het vanaf dag één.
          </Body>
        </View>
      </View>
    </Screen>
  );
}
