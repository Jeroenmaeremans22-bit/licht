import { router } from 'expo-router';
import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { C, F } from './theme';

// ---------- Tekst ----------

export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[s.title, style]}>{children}</Text>;
}
export function H2({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[s.h2, style]}>{children}</Text>;
}
export function Body({
  children,
  style,
  numberOfLines,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  return (
    <Text style={[s.body, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}
export function Muted({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[s.muted, style]}>{children}</Text>;
}
export function Strong({
  children,
  style,
  numberOfLines,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  return (
    <Text style={[s.strong, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

// ---------- Opbouw ----------

export function Screen({
  children,
  footer,
  scroll = true,
  dark = false,
  edges = ['top'],
}: {
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  dark?: boolean;
  edges?: ('top' | 'bottom')[];
}) {
  const bg = dark ? C.camera : C.bg;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={edges}>
      {scroll ? (
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{children}</View>
      )}
      {footer ? <View style={s.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>{children}</View>;
}

export function Grid({ children, cols, gap = 10 }: { children: ReactNode[]; cols: number; gap?: number }) {
  const rows: ReactNode[][] = [];
  children.forEach((c, i) => {
    if (i % cols === 0) rows.push([]);
    rows[rows.length - 1].push(c);
  });
  return (
    <View style={{ gap }}>
      {rows.map((r, i) => (
        <View key={i} style={{ flexDirection: 'row', gap }}>
          {r.map((c, j) => (
            <View key={j} style={{ flex: 1 }}>
              {c}
            </View>
          ))}
          {Array.from({ length: cols - r.length }).map((_, j) => (
            <View key={`e${j}`} style={{ flex: 1 }} />
          ))}
        </View>
      ))}
    </View>
  );
}

// ---------- Knoppen ----------

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  color = C.green,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.primary,
        { backgroundColor: color, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
      ]}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>{label}</Text>}
    </Pressable>
  );
}

export function TextButton({ label, onPress, color = C.green }: { label: string; onPress: () => void; color?: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={s.textBtn} hitSlop={6}>
      <Text style={[s.strong, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  dark,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  dark?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[s.iconBtn, { backgroundColor: dark ? 'rgba(255,255,255,0.12)' : C.card }]}>
      <Icon name={icon} color={dark ? '#fff' : C.ink} />
    </Pressable>
  );
}

/** Keuzekaart met titel en optionele uitleg. */
export function Choice({
  label,
  sub,
  right,
  selected,
  onPress,
}: {
  label: string;
  sub?: string;
  right?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[s.choice, selected ? s.on : s.off]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[s.strong, { fontSize: 15 }]}>{label}</Text>
        {sub ? <Text style={[s.muted, { fontSize: 13 }]}>{sub}</Text> : null}
      </View>
      {right ? <Text style={[s.strong, { fontFamily: F.bold }]}>{right}</Text> : null}
    </Pressable>
  );
}

/** Kleine keuzeknop (pil of chip). */
export function Pill({
  label,
  selected,
  onPress,
  round,
  multi,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  round?: boolean;
  multi?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={multi ? { checked: selected } : { selected }}
      onPress={onPress}
      style={[
        s.pill,
        round ? { borderRadius: 22, paddingHorizontal: 16, minHeight: 44 } : null,
        selected ? s.on : s.off,
      ]}>
      <Text style={[s.strong, { fontSize: round ? 14 : 15, textAlign: 'center' }]}>{label}</Text>
    </Pressable>
  );
}

export function Wrap({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>;
}

// ---------- Invoer ----------

export function NumberField({
  label,
  value,
  onChange,
  unit,
  accent,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit: string;
  accent?: boolean;
}) {
  return (
    <View style={[s.card, { padding: 14, gap: 6, borderRadius: 18 }]}>
      <Text style={[s.muted, { fontSize: 13 }]}>{label}</Text>
      <Row style={{ gap: 4, alignItems: 'baseline' }}>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={(t) => onChange(t.replace(/[^0-9.,]/g, ''))}
          keyboardType="decimal-pad"
          style={[s.numberInput, accent ? { color: C.green } : null]}
          maxLength={5}
          selectTextOnFocus
        />
        <Text style={s.muted}>{unit}</Text>
      </Row>
    </View>
  );
}

export function Stepper({
  value,
  onMinus,
  onPlus,
  label,
}: {
  value: string;
  onMinus: () => void;
  onPlus: () => void;
  label: string;
}) {
  return (
    <Row style={{ gap: 6 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Minder ${label}`} onPress={onMinus} style={s.stepBtn}>
        <Text style={s.stepTxt}>−</Text>
      </Pressable>
      <Text style={[s.h2, { minWidth: 56, textAlign: 'center', fontSize: 20 }]}>{value}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Meer ${label}`} onPress={onPlus} style={s.stepBtn}>
        <Text style={s.stepTxt}>+</Text>
      </Pressable>
    </Row>
  );
}

// ---------- Voortgang ----------

export function Bar({
  value,
  color = C.green,
  track = C.line,
  height = 6,
}: {
  value: number;
  color?: string;
  track?: string;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height, backgroundColor: track, borderRadius: height / 2, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height, backgroundColor: color, borderRadius: height / 2 }} />
    </View>
  );
}

export function Ring({ value, size = 150, children }: { value: number; size?: number; children?: ReactNode }) {
  const r = 84;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  const over = value > 1;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Circle cx={100} cy={100} r={r} stroke={C.line} strokeWidth={18} fill="none" />
        <Circle
          cx={100}
          cy={100}
          r={r}
          stroke={over ? C.warn : C.green}
          strokeWidth={18}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${pct * circ} ${circ}`}
          transform="rotate(-90 100 100)"
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>{children}</View>
    </View>
  );
}

/** Kopregel van de kennismaking: terugknop en stap x van 4. */
export function OnboardingHeader({ step, back = true }: { step: number; back?: boolean }) {
  return (
    <Row style={{ gap: 12, paddingTop: 8 }}>
      {back ? <IconButton icon="back" label="Vorige vraag" onPress={() => router.back()} /> : null}
      <View style={{ flex: 1, gap: 6 }}>
        <Row style={{ gap: 6 }}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i <= step ? C.green : C.lineStrong }} />
          ))}
        </Row>
        <Text style={[s.muted, { fontSize: 13 }]}>Stap {step} van 4</Text>
      </View>
    </Row>
  );
}

// ---------- Iconen ----------

export type IconName = 'home' | 'scan' | 'activity' | 'target' | 'back' | 'plus' | 'check' | 'trash' | 'settings' | 'close' | 'search';

const PATHS: Record<IconName, string[]> = {
  home: ['M3 10.5 12 3l9 7.5', 'M5 9.5V20h14V9.5'],
  scan: ['M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3', 'M7 12h10'],
  activity: ['M3 12h4l3-7 4 14 3-7h4'],
  target: [],
  back: ['M15 5l-7 7 7 7'],
  plus: ['M12 5v14M5 12h14'],
  check: ['M20 6 9 17l-5-5'],
  trash: ['M4 7h16', 'M9 7V4h6v3', 'M6 7l1 13h10l1-13'],
  settings: ['M4 7h9M19 7h1M4 17h1M11 17h9'],
  close: ['M6 6l12 12M18 6 6 18'],
  search: ['M20 20l-4.5-4.5'],
};

export function Icon({ name, color = C.ink, size = 24, stroke = 1.9 }: { name: IconName; color?: string; size?: number; stroke?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {name === 'target' ? (
        <>
          <Circle cx={12} cy={12} r={8} />
          <Circle cx={12} cy={12} r={4} />
        </>
      ) : null}
      {name === 'search' ? <Circle cx={10.5} cy={10.5} r={6} /> : null}
      {name === 'settings' ? (
        <>
          <Circle cx={16} cy={7} r={2.5} />
          <Circle cx={8} cy={17} r={2.5} />
        </>
      ) : null}
      {PATHS[name].map((d, i) => (
        <Path key={i} d={d} />
      ))}
    </Svg>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: F.display, fontSize: 30, color: C.ink, letterSpacing: -0.5, lineHeight: 34 },
  h2: { fontFamily: F.displaySemi, fontSize: 20, color: C.ink },
  body: { fontFamily: F.body, fontSize: 15, color: C.ink, lineHeight: 21 },
  muted: { fontFamily: F.body, fontSize: 14, color: C.muted, lineHeight: 20 },
  strong: { fontFamily: F.semi, fontSize: 15, color: C.ink },
  scroll: { padding: 20, paddingTop: 16, gap: 16, paddingBottom: 32 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, gap: 8 },
  card: { backgroundColor: C.card, borderRadius: 24, padding: 18 },
  primary: { minHeight: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  primaryText: { color: '#fff', fontFamily: F.semi, fontSize: 16 },
  textBtn: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  choice: { flexDirection: 'row', alignItems: 'center', minHeight: 60, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, borderWidth: 2 },
  pill: { minHeight: 48, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  on: { backgroundColor: C.greenSoft, borderColor: C.green },
  off: { backgroundColor: C.card, borderColor: C.line },
  numberInput: { fontFamily: F.display, fontSize: 26, color: C.ink, padding: 0, minWidth: 60 },
  stepBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.line, alignItems: 'center', justifyContent: 'center' },
  stepTxt: { fontFamily: F.semi, fontSize: 22, color: C.ink },
});

export const styles = s;
