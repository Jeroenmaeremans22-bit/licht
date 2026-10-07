import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, F } from '@/theme';
import { Icon, IconName } from '@/ui';

const TABS: { name: string; label: string; icon: IconName; color: string }[] = [
  { name: 'vandaag', label: 'Vandaag', icon: 'home', color: C.green },
  { name: 'beweging', label: 'Beweging', icon: 'activity', color: C.blue },
  { name: 'doel', label: 'Doel', icon: 'target', color: C.green },
];

interface BarProps {
  state: { index: number; routes: { name: string; key: string }[] };
  navigation: { navigate: (name: string) => void };
}

function TabBar({ state, navigation }: BarProps) {
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index]?.name;

  const tab = (t: (typeof TABS)[number]) => {
    const active = current === t.name;
    const color = active ? t.color : C.muted;
    return (
      <Pressable
        key={t.name}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        onPress={() => navigation.navigate(t.name)}
        style={s.tab}>
        <Icon name={t.icon} color={color} />
        <Text style={[s.label, { color, fontFamily: active ? F.semi : F.body }]}>{t.label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {tab(TABS[0])}
      <Pressable accessibilityRole="button" accessibilityLabel="Eten scannen" onPress={() => router.push('/scan')} style={s.scan}>
        <Icon name="scan" color="#fff" size={28} stroke={2} />
      </Pressable>
      {tab(TABS[1])}
      {tab(TABS[2])}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: C.bg } }}
      tabBar={(props) => <TabBar state={props.state} navigation={props.navigation as unknown as BarProps['navigation']} />}>
      <Tabs.Screen name="vandaag" />
      <Tabs.Screen name="beweging" />
      <Tabs.Screen name="doel" />
    </Tabs>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.line,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  tab: { minWidth: 64, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 4 },
  label: { fontSize: 12 },
  scan: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    elevation: 6,
    shadowColor: C.green,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
});
