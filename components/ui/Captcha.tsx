import React, { useCallback, useState } from 'react';
import { View, Pressable } from 'react-native';
import { ShieldCheck, RefreshCw, Check } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';

const POOL = ['🍎', '🐶', '🚗', '⭐', '❤️', '☀️', '🌳', '⚽', '🔔', '🍊', '🎈', '🌸'];

type Challenge = { target: string; options: string[] };

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeChallenge(): Challenge {
  const shuffled = [...POOL].sort(() => Math.random() - 0.5);
  const options = shuffled.slice(0, 4);
  const target = pick(options); // ให้แน่ใจว่ามีคำตอบอยู่ในตัวเลือก
  return { target, options: [...options].sort(() => Math.random() - 0.5) };
}

export type CaptchaProps = {
  /** เรียกเมื่อสถานะยืนยันเปลี่ยน (true = ผ่าน) */
  onChange: (verified: boolean) => void;
};

export function Captcha({ onChange }: CaptchaProps) {
  const t = useTheme();
  const [challenge, setChallenge] = useState<Challenge>(() => makeChallenge());
  const [verified, setVerified] = useState(false);
  const [wrong, setWrong] = useState(false);

  const regenerate = useCallback(() => {
    setChallenge(makeChallenge());
    setVerified(false);
    setWrong(false);
    onChange(false);
  }, [onChange]);

  const onTap = (emoji: string) => {
    if (verified) return;
    if (emoji === challenge.target) {
      setVerified(true);
      setWrong(false);
      onChange(true);
    } else {
      setWrong(true);
      setChallenge(makeChallenge());
      onChange(false);
    }
  };

  return (
    <View
      style={{
        backgroundColor: t.colors.surface,
        borderWidth: 1,
        borderColor: verified ? t.colors.success : t.colors.line,
        borderRadius: t.radius.lg,
        padding: 14,
        marginBottom: 14,
        ...t.shadows.e1,
      }}
    >
      {/* header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <ShieldCheck
          size={18}
          color={verified ? t.colors.successInk : t.colors.primaryStrong}
          strokeWidth={2}
        />
        <Text variant="bodyStrong" weight="600" style={{ flex: 1 }}>
          {verified ? 'ยืนยันแล้ว — ไม่ใช่บอท' : 'ยืนยันว่าไม่ใช่บอท'}
        </Text>
        {!verified ? (
          <Pressable onPress={regenerate} hitSlop={10}>
            <RefreshCw size={16} color={t.colors.ink3} strokeWidth={2} />
          </Pressable>
        ) : (
          <Check size={18} color={t.colors.successInk} strokeWidth={2.6} />
        )}
      </View>

      {verified ? (
        <View
          style={{
            backgroundColor: t.colors.successSoft,
            borderRadius: t.radius.md,
            paddingVertical: 12,
            alignItems: 'center',
          }}
        >
          <Text variant="body" weight="600" style={{ color: t.colors.successInk }}>
            ✓ ผ่านการยืนยัน
          </Text>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Text variant="caption" color="ink2" style={{ flex: 1 }}>
              แตะรูปที่ตรงกับด้านนี้ →
            </Text>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: t.radius.md,
                backgroundColor: t.colors.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 26, lineHeight: 32 }}>{challenge.target}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {challenge.options.map((emoji, i) => (
              <Pressable
                key={`${emoji}-${i}`}
                onPress={() => onTap(emoji)}
                style={({ pressed }) => ({
                  flex: 1,
                  aspectRatio: 1,
                  borderRadius: t.radius.md,
                  borderWidth: 1.5,
                  borderColor: t.colors.line,
                  backgroundColor: t.colors.surface2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Text style={{ fontSize: 28, lineHeight: 34 }}>{emoji}</Text>
              </Pressable>
            ))}
          </View>

          {wrong ? (
            <Text variant="micro" style={{ color: t.colors.dangerInk, marginTop: 8 }}>
              ไม่ถูกต้อง ลองใหม่อีกครั้ง
            </Text>
          ) : null}
        </>
      )}
    </View>
  );
}
