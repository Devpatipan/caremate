import React, { useState } from 'react';
import { View, Pressable, ActivityIndicator, Modal, TextInput, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Tablet, UserPlus, Volume2, Music, BellRing, Radio, Wifi, WifiOff, Copy, Check, RotateCcw, Trash2, Pencil, Plus, ChevronDown } from 'lucide-react-native';
import { Screen, Text, Card, Button, EmptyState, AppDialog } from '../../components/ui';
import type { DialogConfig } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { useCurrentPatient } from '../../lib/patient-context';
import {
  useDevices, useCreateDevice, useUpdateSound, useUnpairDevice, useTestRing, useResetWifi, useUpdateDeviceName,
  deviceState, DeviceState, SOUND_OPTIONS, SoundProfile, Device,
} from '../../lib/devices';

export default function DeviceScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentPatient, currentPatientId } = useCurrentPatient();
  const devices = useDevices(currentPatientId);
  const createDevice = useCreateDevice(currentPatientId);
  const updateSound = useUpdateSound(currentPatientId);
  const updateName = useUpdateDeviceName(currentPatientId);
  const unpair = useUnpairDevice(currentPatientId);
  const testRing = useTestRing(currentPatientId);
  const resetWifi = useResetWifi(currentPatientId);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dialog, setDialog] = useState<DialogConfig | null>(null);
  const [renameFor, setRenameFor] = useState<Device | null>(null);
  const [renameText, setRenameText] = useState('');

  const show = (cfg: DialogConfig) => setDialog(cfg);
  const info = (title: string, message?: string) => show({ title, message, actions: [{ label: 'ตกลง', style: 'cancel' }] });

  const STATUS: Record<DeviceState, { label: string; ink: string; soft: string; dot: string; wifi: boolean }> = {
    online: { label: 'ออนไลน์', ink: t.colors.successInk, soft: t.colors.successSoft, dot: t.colors.success, wifi: true },
    provisioning: { label: 'อยู่ในโหมดตั้งค่า', ink: t.colors.warningInk, soft: t.colors.warningSoft, dot: t.colors.warning, wifi: false },
    offline: { label: 'ออฟไลน์', ink: t.colors.ink3, soft: t.colors.surface2, dot: t.colors.ink3, wifi: false },
    never: { label: 'ยังไม่เคยเชื่อมต่อ', ink: t.colors.ink3, soft: t.colors.surface2, dot: t.colors.ink3, wifi: false },
  };

  const nameOf = (d: Device, i: number) => d.name || `กล่อง ${i + 1}`;

  const onCopy = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      info('คัดลอกไม่สำเร็จ', 'ลองกดค้างที่รหัสเพื่อคัดลอกแทน');
    }
  };
  const onTest = (d: Device) => {
    const online = deviceState(d) === 'online';
    testRing.mutate(d.id, {
      onSuccess: () => info('ส่งคำสั่งแล้ว', online ? 'กล่องจะส่งเสียงเตือนภายใน ~20 วินาที' : 'กล่องออฟไลน์อยู่ จะดังทันทีที่กลับมาออนไลน์'),
      onError: (e: any) => info('ส่งไม่สำเร็จ', e?.message ?? 'ลองใหม่อีกครั้ง'),
    });
  };
  const onResetWifi = (d: Device) => {
    const online = deviceState(d) === 'online';
    show({
      title: 'รีเซ็ต WiFi กล่อง',
      message: 'กล่องจะลืม WiFi เดิมและกลับเข้าโหมดตั้งค่า (ปล่อยสัญญาณ CareMate-Setup) ให้ตั้งเครือข่ายใหม่ผ่านมือถือ\n\nกล่องยังผูกกับผู้ป่วยคนเดิม (device key ไม่เปลี่ยน)',
      actions: [
        { label: 'ยกเลิก', style: 'cancel' },
        {
          label: 'รีเซ็ต WiFi', style: 'destructive',
          onPress: () => resetWifi.mutate(d.id, {
            onSuccess: () => info('ส่งคำสั่งแล้ว', online ? 'กล่องจะรีสตาร์ตเข้าโหมดตั้งค่าภายใน ~20 วินาที' : 'กล่องออฟไลน์อยู่ จะรีเซ็ตเมื่อกลับมาออนไลน์'),
            onError: (e: any) => info('ส่งไม่สำเร็จ', e?.message ?? 'ลองใหม่อีกครั้ง'),
          }),
        },
      ],
    });
  };
  const onUnpair = (d: Device, label: string) => {
    show({
      title: `ถอด "${label}"`,
      message: 'ลบการผูกกล่องนี้กับผู้ป่วย (device key เดิมจะใช้ไม่ได้ ต้องจับคู่ใหม่)',
      actions: [
        { label: 'ยกเลิก', style: 'cancel' },
        {
          label: 'ถอดกล่อง', style: 'destructive',
          onPress: () => unpair.mutate(d.id, {
            onSuccess: () => { setSelectedId(null); info('ถอดกล่องแล้ว', 'ปลดการผูกเรียบร้อย'); },
            onError: (e: any) => info('ถอดไม่สำเร็จ', e?.message ?? 'ลองใหม่อีกครั้ง'),
          }),
        },
      ],
    });
  };
  const openRename = (d: Device, fallback: string) => { setRenameText(d.name || fallback); setRenameFor(d); };
  const saveRename = () => {
    if (!renameFor) return;
    const name = renameText.trim();
    if (name) updateName.mutate({ id: renameFor.id, name });
    setRenameFor(null);
  };
  const addBox = () => { setPickerOpen(false); createDevice.mutate(undefined, { onSuccess: (d) => setSelectedId(d.id) }); };

  if (!currentPatient) {
    return (
      <Screen>
        <Text variant="h1" weight="700" style={{ marginBottom: 20 }}>อุปกรณ์</Text>
        <Card style={{ alignItems: 'center', paddingVertical: 28, marginTop: 8 }}>
          <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: t.colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <UserPlus size={26} color={t.colors.primaryStrong} strokeWidth={2} />
          </View>
          <Text variant="h2" weight="700" center style={{ marginBottom: 6 }}>เพิ่มผู้ป่วยก่อน</Text>
          <Text variant="body" color="ink3" center style={{ marginBottom: 16 }}>ต้องมีผู้ป่วยก่อนจึงจะผูกกล่องได้</Text>
          <Button label="เพิ่มผู้ป่วย" onPress={() => router.push('/add-patient')} />
        </Card>
      </Screen>
    );
  }

  const list = devices.data ?? [];
  const selIndex = Math.max(0, list.findIndex((x) => x.id === selectedId));
  const d = list.find((x) => x.id === selectedId) ?? list[0];
  const selName = d ? nameOf(d, selIndex) : '';
  const testing = testRing.isPending && (testRing.variables as any) === d?.id;
  const resetting = resetWifi.isPending && (resetWifi.variables as any) === d?.id;
  const unpairing = unpair.isPending && (unpair.variables as any) === d?.id;

  return (
    <Screen>
      <Text variant="h1" weight="700" style={{ marginBottom: 14 }}>อุปกรณ์</Text>

      {devices.isLoading ? (
        <ActivityIndicator color={t.colors.primary} style={{ marginTop: 30 }} />
      ) : list.length === 0 ? (
        <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
          <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: t.colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Tablet size={28} color={t.colors.primaryStrong} strokeWidth={2} />
          </View>
          <Text variant="h2" weight="700" center style={{ marginBottom: 6 }}>ยังไม่ได้ผูกกล่อง</Text>
          <Text variant="body" color="ink3" center style={{ marginBottom: 18, paddingHorizontal: 10 }}>ผูกกล่องเตือนยา KidBright เข้ากับผู้ป่วยคนนี้ เพื่อรับรหัสสำหรับตั้งค่ากล่อง</Text>
          <Button label="ผูกกล่อง KidBright" loading={createDevice.isPending} icon={<Radio size={18} color={t.colors.onPrimary} strokeWidth={2} />} onPress={addBox} />
        </Card>
      ) : d ? (
        <>
          {/* Dropdown เลือกกล่อง */}
          <Pressable onPress={() => setPickerOpen(true)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: t.colors.surface, borderWidth: 1.5, borderColor: t.colors.line, borderRadius: t.radius.lg, padding: 13, ...t.shadows.e1 }}>
            <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: t.blue[700], alignItems: 'center', justifyContent: 'center' }}>
              <Tablet size={21} color="#fff" strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" weight="700" numberOfLines={1}>{selName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: STATUS[deviceState(d)].dot }} />
                <Text variant="micro" weight="600" style={{ color: STATUS[deviceState(d)].ink }}>{STATUS[deviceState(d)].label}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {list.length > 1 ? <View style={{ backgroundColor: t.colors.primarySoft, borderRadius: t.radius.pill, paddingVertical: 3, paddingHorizontal: 9 }}><Text variant="micro" weight="700" style={{ color: t.colors.primaryStrong }}>{list.length} กล่อง</Text></View> : null}
              <ChevronDown size={20} color={t.colors.ink2} strokeWidth={2.2} />
            </View>
          </Pressable>

          {/* รายละเอียดกล่องที่เลือก (เต็มหน้า) */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 8 }}>
            <Text variant="title" weight="700" numberOfLines={1} style={{ flex: 1 }}>{selName}</Text>
            <Pressable onPress={() => openRename(d!, selName)} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: t.colors.surface2, paddingVertical: 6, paddingHorizontal: 11, borderRadius: t.radius.pill }}>
              <Pencil size={13} color={t.colors.ink2} strokeWidth={2} />
              <Text variant="micro" weight="700" color="ink2">เปลี่ยนชื่อ</Text>
            </Pressable>
          </View>

          {/* device key */}
          <Card>
            <Text variant="micro" color="ink3" style={{ marginBottom: 4 }}>รหัสอุปกรณ์ (device key) — ใช้ตอนตั้งค่ากล่อง</Text>
            <View style={{ backgroundColor: t.colors.surface2, borderRadius: t.radius.md, paddingVertical: 11, paddingHorizontal: 13 }}>
              <Text weight="700" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={{ fontSize: 14, letterSpacing: 0.4, textAlign: 'center' }} selectable>{d.device_key}</Text>
            </View>
            <Pressable onPress={() => onCopy(d.device_key)} style={{ marginTop: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: copied ? t.colors.successSoft : t.colors.primarySoft, paddingVertical: 11, borderRadius: t.radius.md }}>
              {copied ? <Check size={16} color={t.colors.successInk} strokeWidth={2.6} /> : <Copy size={16} color={t.colors.primaryStrong} strokeWidth={2.2} />}
              <Text variant="caption" weight="700" style={{ color: copied ? t.colors.successInk : t.colors.primaryStrong }}>{copied ? 'คัดลอกแล้ว' : 'คัดลอกรหัส'}</Text>
            </Pressable>
          </Card>

          {/* เสียงเตือน */}
          <Text variant="title" weight="700" style={{ marginTop: 18, marginBottom: 10 }}>เสียงเตือน</Text>
          {SOUND_OPTIONS.map((opt) => {
            const sel = d.sound_profile === opt.id;
            const Icon = opt.id === 'custom' ? Volume2 : opt.id === 'buzzer' ? BellRing : Music;
            return (
              <Pressable key={opt.id} onPress={() => updateSound.mutate({ id: d.id, sound_profile: opt.id as SoundProfile })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderWidth: 1.5, borderColor: sel ? t.colors.primary : t.colors.line, borderRadius: t.radius.lg, marginBottom: 10, backgroundColor: sel ? t.colors.primarySoft : t.colors.surface }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: sel ? t.colors.primary : t.colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={sel ? '#fff' : t.colors.primaryStrong} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" weight="600">{opt.name}</Text>
                  <Text variant="caption" color="ink3">{opt.detail}</Text>
                </View>
                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: sel ? t.colors.primary : t.colors.line, backgroundColor: sel ? t.colors.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {sel ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} /> : null}
                </View>
              </Pressable>
            );
          })}

          {/* ปุ่มจัดการกล่องนี้ */}
          <Button label="ทดสอบการเตือนที่กล่อง" block loading={testing} icon={<BellRing size={18} color={t.colors.onPrimary} strokeWidth={2} />} onPress={() => onTest(d!)} style={{ marginTop: 6 }} />
          <Button label="รีเซ็ต WiFi กล่อง (ตั้งเครือข่ายใหม่)" block variant="secondary" loading={resetting} icon={<RotateCcw size={17} color={t.colors.primaryStrong} strokeWidth={2.2} />} onPress={() => onResetWifi(d!)} style={{ marginTop: 10 }} />
          <Button label="ถอดกล่องออกจากผู้ป่วย" block variant="ghost" loading={unpairing} icon={<Trash2 size={17} color={t.colors.dangerInk} strokeWidth={2} />} onPress={() => onUnpair(d!, selName)} style={{ marginTop: 10 }} />
        </>
      ) : null}

      {/* Picker เลือกกล่อง */}
      <Modal visible={pickerOpen} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setPickerOpen(false)}>
        <Pressable onPress={() => setPickerOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(15,37,64,0.5)', justifyContent: 'flex-end' }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: t.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10, paddingBottom: insets.bottom + 18, paddingHorizontal: 18 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: t.colors.line, alignSelf: 'center', marginBottom: 14 }} />
            <Text variant="title" weight="700" style={{ marginBottom: 12 }}>เลือกกล่อง</Text>
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {list.map((box, i) => {
                const sel = box.id === d?.id;
                const bs = STATUS[deviceState(box)];
                return (
                  <Pressable key={box.id} onPress={() => { setSelectedId(box.id); setPickerOpen(false); }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: t.radius.lg, marginBottom: 8, borderWidth: 1.5, borderColor: sel ? t.colors.primary : t.colors.line, backgroundColor: sel ? t.colors.primarySoft : t.colors.surface }}>
                    <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: t.blue[700], alignItems: 'center', justifyContent: 'center' }}>
                      <Tablet size={19} color="#fff" strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong" weight="600" numberOfLines={1}>{nameOf(box, i)}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: bs.dot }} />
                        <Text variant="micro" weight="600" style={{ color: bs.ink }}>{bs.label}</Text>
                      </View>
                    </View>
                    {sel ? <Check size={18} color={t.colors.primaryStrong} strokeWidth={3} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Button label="เพิ่มกล่องอีกตัว" variant="secondary" block loading={createDevice.isPending} icon={<Plus size={18} color={t.colors.primaryStrong} strokeWidth={2.4} />} onPress={addBox} style={{ marginTop: 6 }} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* ป็อปอัปยืนยัน/แจ้งผล */}
      <AppDialog visible={!!dialog} config={dialog} onClose={() => setDialog(null)} />

      {/* โมดัลเปลี่ยนชื่อกล่อง */}
      <Modal visible={!!renameFor} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setRenameFor(null)}>
        <Pressable onPress={() => setRenameFor(null)} style={{ flex: 1, backgroundColor: 'rgba(15,37,64,0.5)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>
          <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 380, backgroundColor: t.colors.surface, borderRadius: t.radius.xl, padding: 22, ...t.shadows.e3 }}>
            <Text variant="title" weight="700" style={{ marginBottom: 6 }}>ตั้งชื่อกล่อง</Text>
            <Text variant="caption" color="ink3" style={{ marginBottom: 14 }}>เช่น ห้องนอนพ่อ, ห้องครัว, กล่องยาย</Text>
            <TextInput
              value={renameText} onChangeText={setRenameText} placeholder="ชื่อกล่อง" placeholderTextColor={t.colors.ink3} autoFocus
              style={{ borderWidth: 1.5, borderColor: t.colors.line, borderRadius: t.radius.md, paddingVertical: 12, paddingHorizontal: 14, fontSize: 16, color: t.colors.ink }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
              <Pressable onPress={() => setRenameFor(null)} style={{ paddingVertical: 12, paddingHorizontal: 18, borderRadius: t.radius.md, backgroundColor: t.colors.surface2 }}>
                <Text weight="700" color="ink2">ยกเลิก</Text>
              </Pressable>
              <Pressable onPress={saveRename} style={{ paddingVertical: 12, paddingHorizontal: 18, borderRadius: t.radius.md, backgroundColor: t.colors.primary }}>
                <Text weight="700" style={{ color: '#fff' }}>บันทึก</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
