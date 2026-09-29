import React from 'react';
import { Modal, View, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';

export type DialogAction = {
  label: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

export type DialogConfig = {
  title: string;
  message?: string;
  actions: DialogAction[];
};

/** ป็อปอัปยืนยัน/แจ้งผล ที่เข้ากับธีมแอป (แทน Alert.alert ของระบบ) */
export function AppDialog({
  visible,
  config,
  onClose,
}: {
  visible: boolean;
  config: DialogConfig | null;
  onClose: () => void;
}) {
  const t = useTheme();
  if (!config) return null;

  const bgFor = (s?: string) =>
    s === 'destructive' ? t.colors.danger : s === 'cancel' ? t.colors.surface2 : t.colors.primary;
  const fgFor = (s?: string) => (s === 'cancel' ? t.colors.ink2 : '#FFFFFF');

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(15,37,64,0.5)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}
      >
        <Pressable
          onPress={() => {}}
          style={{ width: '100%', maxWidth: 380, backgroundColor: t.colors.surface, borderRadius: t.radius.xl, padding: 22, ...t.shadows.e3 }}
        >
          <Text variant="title" weight="700" style={{ marginBottom: config.message ? 8 : 18 }}>
            {config.title}
          </Text>
          {config.message ? (
            <Text variant="body" color="ink2" style={{ marginBottom: 22, lineHeight: 22 }}>
              {config.message}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
            {config.actions.map((a, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  onClose();
                  a.onPress?.();
                }}
                style={{ paddingVertical: 12, paddingHorizontal: 18, borderRadius: t.radius.md, backgroundColor: bgFor(a.style) }}
              >
                <Text weight="700" style={{ color: fgFor(a.style) }}>{a.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
