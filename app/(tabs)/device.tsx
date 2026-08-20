import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Volume2, Bell, Mic } from 'lucide-react-native';
import { Screen, Text, Badge, Button, SectionLabel, Card } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { device, soundOptions, SoundOption } from '../../lib/mockData';

function KidBrightBox() {
  const t = useTheme();
  // 8x3 LED matrix mock (a pill icon-ish pattern)
  const on = new Set([1, 2, 5, 6, 8, 11, 12, 15, 16, 19, 20, 23]);
  return (
    <View
      style={{
        width: 120,
        height: 100,
        borderRadius: 18,
        backgroundColor: t.blue[600],
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 14,
        ...t.shadows.e2,
      }}
    >
      <View
        style={{
          width: 76,
          height: 34,
          borderRadius: 7,
          backgroundColor: '#0c1a2b',
          flexDirection: 'row',
          flexWrap: 'wrap',
          padding: 5,
          gap: 2,
        }}
      >
        {Array.from({ length: 24 }).map((_, i) => (
          <View
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: 1,
              backgroundColor: on.has(i) ? '#ffd34d' : '#12324f',
            }}
          />
        ))}
      </View>
    </View>
  );
}

function SoundRow({
  option,
  selected,
  onPress,
}: {
  option: SoundOption;
  selected: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  const Icon = option.id === 'voice_th' ? Volume2 : option.id === 'buzzer' ? Bell : Mic;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 13,
        borderWidth: 1.5,
        borderColor: selected ? t.colors.primary : t.colors.line,
        backgroundColor: selected ? t.colors.primarySoft : t.colors.surface,
        borderRadius: t.radius.lg,
        marginBottom: 10,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: selected ? t.colors.primary : t.colors.surface2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={18} color={selected ? '#FFFFFF' : t.colors.primaryStrong} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" weight="600" style={{ fontSize: 14 }}>
          {option.name}
        </Text>
        <Text variant="caption" color="ink3">
          {option.detail}
        </Text>
      </View>
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: selected ? t.colors.primary : t.colors.line,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected ? (
          <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: t.colors.primary }} />
        ) : null}
      </View>
    </Pressable>
  );
}

export default function Device() {
  const t = useTheme();
  const [sound, setSound] = useState(device.soundProfile);

  return (
    <Screen>
      <Text variant="h1" weight="700" style={{ marginBottom: 14 }}>
        อุปกรณ์
      </Text>

      {/* Device hero */}
      <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
        <KidBrightBox />
        <Text variant="title" weight="700">
          {device.name}
        </Text>
        <Badge label="ออนไลน์" tone="ok" dot style={{ marginTop: 8 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 14 }}>
          <Text variant="caption" color="ink3">
            📶 {device.signal}
          </Text>
          <Text variant="caption" color="ink3">
            🕒 อัปเดต 20 วิ
          </Text>
          <Text variant="caption" color="ink3">
            {device.model}
          </Text>
        </View>
      </Card>

      {/* Sound profile */}
      <SectionLabel title="เสียงเตือน" actionLabel="▶ ทดสอบ" onActionPress={() => {}} />
      {soundOptions.map((opt) => (
        <SoundRow key={opt.id} option={opt} selected={sound === opt.id} onPress={() => setSound(opt.id)} />
      ))}

      <View style={{ marginTop: 6, gap: 10 }}>
        <Button
          label="ทดสอบการเตือนที่กล่อง"
          block
          icon={<Bell size={18} color={t.colors.onPrimary} strokeWidth={2} />}
        />
        <Button label="ผูก / ถอดกล่อง" variant="ghost" block />
      </View>
    </Screen>
  );
}
