import React from 'react';
import { View } from 'react-native';
import { User, Users, Phone, FileText, Bell, LogOut, ChevronRight } from 'lucide-react-native';
import { Screen, Text, ListRow, ListGroup } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { patient } from '../../lib/mockData';

export default function More() {
  const t = useTheme();

  return (
    <Screen>
      <Text variant="h1" weight="700" style={{ marginBottom: 14 }}>
        เพิ่มเติม
      </Text>

      {/* Patient profile card */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          backgroundColor: t.blue[700],
          borderRadius: t.radius.xl,
          padding: 18,
          marginBottom: 16,
          ...t.shadows.e2,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="h1" weight="700" style={{ color: '#FFFFFF' }}>
            {patient.initial}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="h2" weight="700" style={{ color: '#FFFFFF' }}>
            {patient.name}
          </Text>
          <Text variant="caption" style={{ color: '#FFFFFF', opacity: 0.85 }}>
            อายุ {patient.age} ปี · กรุ๊ปเลือด {patient.bloodType} · {patient.diseases}
          </Text>
        </View>
        <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.4} />
      </View>

      <View style={{ marginBottom: 14 }}>
        <ListGroup>
          <ListRow icon={<User size={18} color={t.colors.primaryStrong} strokeWidth={2} />} label="ข้อมูลผู้ป่วย & ประวัติแพ้ยา" />
          <ListRow icon={<Users size={18} color={t.colors.primaryStrong} strokeWidth={2} />} label="สลับ / เพิ่มผู้ป่วย" last />
        </ListGroup>
      </View>

      <View style={{ marginBottom: 14 }}>
        <ListGroup>
          <ListRow danger icon={<Phone size={18} color={t.colors.dangerInk} strokeWidth={2} />} label="ผู้ติดต่อฉุกเฉิน (SOS)" />
          <ListRow icon={<FileText size={18} color={t.colors.primaryStrong} strokeWidth={2} />} label="รายงาน PDF ส่งแพทย์" />
          <ListRow icon={<Bell size={18} color={t.colors.primaryStrong} strokeWidth={2} />} label="ตั้งค่าการแจ้งเตือน" last />
        </ListGroup>
      </View>

      <ListGroup>
        <ListRow icon={<User size={18} color={t.colors.primaryStrong} strokeWidth={2} />} label="โปรไฟล์ผู้ดูแล" />
        <ListRow
          danger
          showChevron={false}
          icon={<LogOut size={18} color={t.colors.dangerInk} strokeWidth={2} />}
          label="ออกจากระบบ"
          last
        />
      </ListGroup>
    </Screen>
  );
}
