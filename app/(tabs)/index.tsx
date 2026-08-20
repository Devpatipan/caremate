import React from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, ChevronDown, ChevronRight, Heart, Droplet, Activity, Tablet } from 'lucide-react-native';
import { Screen, Text, StatTile, SectionLabel, Card } from '../../components/ui';
import { HeroMedCard } from '../../components/app/HeroMedCard';
import { AlertBanner } from '../../components/app/AlertBanner';
import { useTheme } from '../../theme/ThemeProvider';
import { patient, todayMed, vitals, nextAppointment, device, alerts } from '../../lib/mockData';

export default function Dashboard() {
  const t = useTheme();
  const router = useRouter();
  const unreadCount = alerts.filter((a) => a.unread).length;

  return (
    <Screen>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <View style={{ flex: 1 }}>
          <Text variant="caption" color="ink3">
            สวัสดีตอนเช้า 🌤️
          </Text>
          <Pressable
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              alignSelf: 'flex-start',
              marginTop: 5,
              backgroundColor: t.colors.surface,
              borderColor: t.colors.line,
              borderWidth: 1,
              paddingVertical: 7,
              paddingLeft: 8,
              paddingRight: 12,
              borderRadius: t.radius.pill,
              ...t.shadows.e1,
            }}
          >
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: t.blue[200],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text variant="micro" weight="700" style={{ color: t.blue[800] }}>
                {patient.initial}
              </Text>
            </View>
            <Text variant="caption" weight="600">
              {patient.shortName}
            </Text>
            <ChevronDown size={14} color={t.colors.ink2} strokeWidth={2.4} />
          </Pressable>
        </View>
        <Pressable
          onPress={() => router.push('/alerts')}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: t.colors.surface,
            borderColor: t.colors.line,
            borderWidth: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Bell size={20} color={t.colors.ink2} strokeWidth={2} />
          {unreadCount > 0 ? (
            <View
              style={{
                position: 'absolute',
                top: 7,
                right: 8,
                width: 9,
                height: 9,
                borderRadius: 5,
                backgroundColor: t.colors.danger,
                borderWidth: 2,
                borderColor: t.colors.surface,
              }}
            />
          ) : null}
        </Pressable>
      </View>

      {/* Hero: today's medication status */}
      <View style={{ marginTop: 10 }}>
        <HeroMedCard taken={todayMed.taken} total={todayMed.total} nextDose={todayMed.nextDose} />
      </View>

      {/* Urgent alert */}
      <AlertBanner
        title="ยังไม่ทานยา 07:30"
        detail="เกินเวลา 15 นาที · แตะเพื่อดู"
        onPress={() => router.push('/alerts')}
      />

      {/* Latest vitals */}
      <SectionLabel title="ค่าสุขภาพล่าสุด" actionLabel="ดูทั้งหมด" onActionPress={() => router.push('/health')} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <StatTile
          label="ความดัน"
          value="128"
          unit="/82"
          status="ok"
          statusLabel="ปกติ"
          icon={<Heart size={14} color={t.colors.danger} strokeWidth={2} />}
        />
        <StatTile
          label="น้ำตาล"
          value="110"
          unit="mg"
          status="ok"
          statusLabel="ปกติ"
          icon={<Droplet size={14} color={t.colors.primary} strokeWidth={2} />}
        />
        <StatTile
          label="หัวใจ"
          value="72"
          unit="bpm"
          status="ok"
          statusLabel="ปกติ"
          icon={<Activity size={14} color={t.colors.warning} strokeWidth={2} />}
        />
      </View>

      {/* Next appointment */}
      <SectionLabel title="นัดหมายถัดไป" />
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            backgroundColor: t.colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="title" weight="700" style={{ color: t.colors.primaryStrong }}>
            {nextAppointment.day}
          </Text>
          <Text variant="micro" weight="600" style={{ color: t.colors.primaryStrong }}>
            {nextAppointment.month}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" weight="600">
            {nextAppointment.title}
          </Text>
          <Text variant="caption" color="ink3">
            {nextAppointment.detail}
          </Text>
        </View>
        <ChevronRight size={18} color={t.colors.ink3} strokeWidth={2.4} />
      </Card>

      {/* Device status */}
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 11,
            backgroundColor: t.colors.successSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Tablet size={20} color={t.colors.successInk} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" weight="600" style={{ fontSize: 14 }}>
            กล่องเตือนยา KidBright
          </Text>
          <Text variant="caption" color="ink3">
            ออนไลน์ · อัปเดต {device.lastSeen}
          </Text>
        </View>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.success }} />
      </Card>
    </Screen>
  );
}
