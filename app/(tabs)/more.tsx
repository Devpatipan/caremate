import React, { useState } from 'react';
import { View, Alert, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Users, Phone, FileText, Bell, LogOut, ChevronRight, Moon, Sun, UserPlus, CalendarDays, Trash2 } from 'lucide-react-native';
import { Screen, Text, ListRow, ListGroup, Avatar } from '../../components/ui';
import { useTheme, useThemeControls } from '../../theme/ThemeProvider';
import { useAuth } from '../../lib/auth';
import { useCurrentPatient } from '../../lib/patient-context';
import { useAdherence7d } from '../../lib/medications';
import { generatePatientReport } from '../../lib/report';
import { deleteAccount } from '../../lib/account';

export default function More() {
  const t = useTheme();
  const router = useRouter();
  const { scheme, toggle } = useThemeControls();
  const { user, signOut } = useAuth();
  const { currentPatient, currentPatientId } = useCurrentPatient();
  const adherence = useAdherence7d(currentPatientId);
  const isDark = scheme === 'dark';
  const [pdfBusy, setPdfBusy] = useState(false);
  const [delBusy, setDelBusy] = useState(false);

  const onDeleteAccount = () => {
    Alert.alert(
      'ลบบัญชีถาวร',
      'ลบบัญชีและข้อมูลทั้งหมดของคุณอย่างถาวร — ผู้ป่วยที่คุณดูแลคนเดียว, ยา, ค่าสุขภาพ, นัดหมาย, กล่อง\n\nการลบนี้ย้อนกลับไม่ได้ (สิทธิ์ตาม PDPA)',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบบัญชีถาวร', style: 'destructive',
          onPress: () => Alert.alert('ยืนยันอีกครั้ง', 'แน่ใจนะ? ข้อมูลทั้งหมดจะหายถาวร กู้คืนไม่ได้', [
            { text: 'ยกเลิก', style: 'cancel' },
            {
              text: 'ลบเลย', style: 'destructive',
              onPress: async () => {
                setDelBusy(true);
                try { await deleteAccount(); await signOut(); }
                catch (e: any) { Alert.alert('ลบไม่สำเร็จ', e?.message ?? 'ลองใหม่อีกครั้ง'); }
                finally { setDelBusy(false); }
              },
            },
          ]),
        },
      ],
    );
  };

  const onLogout = () => {
    Alert.alert('ออกจากระบบ', 'ต้องการออกจากระบบใช่ไหม?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ออกจากระบบ', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const onReport = async () => {
    if (pdfBusy) return;
    if (!currentPatient) { Alert.alert('ยังไม่มีผู้ป่วย', 'กรุณาเพิ่มผู้ป่วยก่อนออกรายงาน'); return; }
    setPdfBusy(true);
    try { await generatePatientReport(currentPatient, adherence.data ?? null); }
    catch (e: any) { Alert.alert('สร้างรายงานไม่สำเร็จ', e?.message ?? 'ลองใหม่อีกครั้ง'); }
    finally { setPdfBusy(false); }
  };

  return (
    <Screen>
      <Text variant="h1" weight="700" style={{ marginBottom: 14 }}>เพิ่มเติม</Text>

      {currentPatient ? (
        <Pressable onPress={() => router.push({ pathname: '/patient-profile', params: { id: currentPatientId ?? '' } })} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: t.blue[700], borderRadius: t.radius.xl, padding: 18, marginBottom: 16, ...t.shadows.e2 }}>
          <Avatar name={currentPatient.name} photoUrl={currentPatient.photo_url} size={56} bg="rgba(255,255,255,0.2)" fg="#fff" />
          <View style={{ flex: 1 }}>
            <Text variant="h2" weight="700" style={{ color: '#FFFFFF' }}>{currentPatient.name}</Text>
            <Text variant="caption" style={{ color: '#FFFFFF', opacity: 0.85 }}>
              {[currentPatient.gender, currentPatient.blood_type ? `กรุ๊ปเลือด ${currentPatient.blood_type}` : null, currentPatient.diseases].filter(Boolean).join(' · ') || 'แตะเพื่อจัดการผู้ป่วย'}
            </Text>
          </View>
          <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.4} />
        </Pressable>
      ) : (
        <Pressable onPress={() => router.push('/add-patient')} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, borderRadius: t.radius.xl, padding: 18, marginBottom: 16, ...t.shadows.e1 }}>
          <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: t.colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <UserPlus size={26} color={t.colors.primaryStrong} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" weight="700">เพิ่มผู้ป่วยคนแรก</Text>
            <Text variant="caption" color="ink3">ยังไม่มีผู้ป่วยที่ดูแล แตะเพื่อเพิ่ม</Text>
          </View>
          <ChevronRight size={18} color={t.colors.ink3} strokeWidth={2.4} />
        </Pressable>
      )}

      <View style={{ marginBottom: 14 }}>
        <ListGroup>
          <ListRow icon={<Users size={18} color={t.colors.primaryStrong} strokeWidth={2} />} label="สลับ / เพิ่มผู้ป่วย" onPress={() => router.push('/patients')} />
          <ListRow icon={<CalendarDays size={18} color={t.colors.primaryStrong} strokeWidth={2} />} label="นัดหมายแพทย์" onPress={() => router.push('/appointments')} last />
        </ListGroup>
      </View>

      <View style={{ marginBottom: 14 }}>
        <ListGroup>
          <ListRow danger icon={<Phone size={18} color={t.colors.dangerInk} strokeWidth={2} />} label="ผู้ติดต่อฉุกเฉิน (SOS)" onPress={() => router.push('/sos')} />
          <Pressable onPress={onReport} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: t.colors.line2 }}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={18} color={t.colors.primaryStrong} strokeWidth={2} />
            </View>
            <Text variant="bodyStrong" weight="600" style={{ flex: 1 }}>รายงาน PDF ส่งแพทย์</Text>
            {pdfBusy ? <ActivityIndicator color={t.colors.primary} /> : <ChevronRight size={18} color={t.colors.ink3} strokeWidth={2.2} />}
          </Pressable>
          <ListRow icon={<Bell size={18} color={t.colors.primaryStrong} strokeWidth={2} />} label="ตั้งค่าการแจ้งเตือน" onPress={() => router.push('/notifications')} last />
        </ListGroup>
      </View>

      <Text variant="caption" weight="600" color="ink3" style={{ marginBottom: 8, marginLeft: 2 }}>การตั้งค่า</Text>
      <View style={{ marginBottom: 14 }}>
        <ListGroup>
          <Pressable onPress={toggle} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14, paddingHorizontal: 16 }}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
              {isDark ? <Moon size={18} color={t.colors.primaryStrong} strokeWidth={2} /> : <Sun size={18} color={t.colors.primaryStrong} strokeWidth={2} />}
            </View>
            <Text variant="bodyStrong" weight="600" style={{ flex: 1 }}>โหมดมืด</Text>
            <View style={{ width: 46, height: 28, borderRadius: 999, backgroundColor: isDark ? t.colors.primary : t.colors.line, padding: 3, justifyContent: 'center' }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF', alignSelf: isDark ? 'flex-end' : 'flex-start', ...t.shadows.e1 }} />
            </View>
          </Pressable>
        </ListGroup>
      </View>

      <ListGroup>
        <ListRow icon={<User size={18} color={t.colors.primaryStrong} strokeWidth={2} />} label={user?.email ? `โปรไฟล์ผู้ดูแล · ${user.email}` : 'โปรไฟล์ผู้ดูแล'} showChevron={false} />
        <ListRow danger showChevron={false} icon={<LogOut size={18} color={t.colors.dangerInk} strokeWidth={2} />} label="ออกจากระบบ" onPress={onLogout} />
        <Pressable onPress={onDeleteAccount} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14, paddingHorizontal: 16 }}>
          <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.colors.dangerSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Trash2 size={18} color={t.colors.dangerInk} strokeWidth={2} />
          </View>
          <Text variant="bodyStrong" weight="600" style={{ flex: 1, color: t.colors.dangerInk }}>ลบบัญชีถาวร (PDPA)</Text>
          {delBusy ? <ActivityIndicator color={t.colors.danger} /> : null}
        </Pressable>
      </ListGroup>
    </Screen>
  );
}
