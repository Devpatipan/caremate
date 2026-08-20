import React from 'react';
import { Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';

export type ListRowProps = {
  icon?: React.ReactNode;
  label: string;
  danger?: boolean;
  showChevron?: boolean;
  first?: boolean;
  last?: boolean;
  onPress?: () => void;
};

/** A single row inside a grouped list card. Wrap rows in <ListGroup>. */
export function ListRow({
  icon,
  label,
  danger,
  showChevron = true,
  last,
  onPress,
}: ListRowProps) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: t.colors.line2,
      }}
    >
      {icon ? (
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            backgroundColor: danger ? t.colors.dangerSoft : t.colors.surface2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </View>
      ) : null}
      <Text
        variant="bodyStrong"
        weight="600"
        style={{ flex: 1, color: danger ? t.colors.dangerInk : t.colors.ink }}
      >
        {label}
      </Text>
      {showChevron ? <ChevronRight size={18} color={t.colors.ink3} strokeWidth={2.2} /> : null}
    </Pressable>
  );
}

export function ListGroup({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.colors.surface,
        borderColor: t.colors.line,
        borderWidth: 1,
        borderRadius: t.radius.lg,
        overflow: 'hidden',
        ...t.shadows.e1,
      }}
    >
      {children}
    </View>
  );
}
