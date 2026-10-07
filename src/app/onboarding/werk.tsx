import { router } from 'expo-router';
import { View } from 'react-native';

import { Commute, Job } from '@/calc';
import { useStore } from '@/store';
import { Choice, Muted, OnboardingHeader, Pill, PrimaryButton, Screen, Strong, Title, Wrap } from '@/ui';

const JOBS: { id: Job; label: string; sub: string }[] = [
  { id: 'zittend', label: 'Vooral zitten', sub: 'Kantoor, student, chauffeur' },
  { id: 'staand', label: 'Veel staan en rondlopen', sub: 'Winkel, horeca, leerkracht' },
  { id: 'fysiek', label: 'Fysiek werk', sub: 'Magazijn, zorg, schoonmaak' },
  { id: 'zwaar', label: 'Zwaar lichamelijk werk', sub: 'Bouw, landbouw, verhuis' },
  { id: 'geen', label: 'Ik werk momenteel niet', sub: 'Thuis, gepensioneerd, op zoek' },
];

const COMMUTES: { id: Commute; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'ov', label: 'Bus / trein' },
  { id: 'fiets', label: 'Fiets' },
  { id: 'voet', label: 'Te voet' },
  { id: 'thuis', label: 'Thuiswerk' },
];

export default function Werk() {
  const answers = useStore((s) => s.answers);
  const setAnswers = useStore((s) => s.setAnswers);

  return (
    <Screen footer={<PrimaryButton label="Volgende" onPress={() => router.push('/onboarding/sport')} />}>
      <OnboardingHeader step={2} />
      <View style={{ gap: 6 }}>
        <Title>Wat voor werk doe je?</Title>
        <Muted style={{ fontSize: 15 }}>Je werk bepaalt een groot deel van wat je op een dag verbruikt.</Muted>
      </View>

      <View style={{ gap: 8 }}>
        {JOBS.map((j) => (
          <Choice
            key={j.id}
            label={j.label}
            sub={j.sub}
            selected={answers.job === j.id}
            onPress={() => setAnswers(j.id === 'geen' ? { job: j.id, commute: 'thuis' } : { job: j.id })}
          />
        ))}
      </View>

      {answers.job !== 'geen' ? (
        <View style={{ gap: 10 }}>
          <Strong>Hoe ga je meestal naar je werk?</Strong>
          <Wrap>
            {COMMUTES.map((c) => (
              <Pill
                key={c.id}
                round
                label={c.label}
                selected={answers.commute === c.id}
                onPress={() => setAnswers({ commute: c.id })}
              />
            ))}
          </Wrap>
        </View>
      ) : null}
    </Screen>
  );
}
