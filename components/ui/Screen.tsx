import React from 'react';
import { View, ScrollView, ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme, useThemeControls } from '../../theme/ThemeProvider';

export type ScreenProps = ScrollViewProps & {
  children: React.ReactNode;
  /** Render as a plain (non-scrolling) container. */
  scroll?: boolean;
  /** Extra bottom padding so content clears the tab bar / FAB. */
  bottomInset?: number;
};

export function Screen({
  children,
  scroll = true,
  bottomInset = 24,
  contentContainerStyle,
  ...rest
}: ScreenProps) {
  const t = useTheme();
  const { scheme } = useThemeControls();
  const insets = useSafeAreaInsets();

  const padding = {
    paddingTop: insets.top + 4,
    paddingHorizontal: 18,
    paddingBottom: insets.bottom + bottomInset,
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.canvas }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[padding, contentContainerStyle]}
          {...rest}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, padding]}>{children}</View>
      )}
    </View>
  );
}
