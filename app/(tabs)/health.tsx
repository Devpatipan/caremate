import React, { useState, useCallback } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, HeartPulse, UserPlus, ChevronRight, TrendingUp, TrendingDown, Minus, Lightbulb } from 'lucide-react-native';
import { Screen, Text, SegmentedControl, Card, Button, EmptyState, Avatar } from '../../components/ui';
import { TrendChart } from '../../components/charts/TrendChart';
import { useTheme } from '../../theme/ThemeProvider';
import { useCurrentPatient } from '../../lib/patient-context';
import { useVitals, interpretVital, vitalContextLabel, vitalAdvice, vitalNormalRange, vitalPrimary, VitalType, Vital } from '../../lib/vitals';

const dateLabel = (iso: string) => { const d = new Date(iso); return `${d.getDate()}/${d.getMonth() + 1}`; };
const timeLabel = (iso: string) => { const d = new Date(iso); return `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
function niceDomain(min: number, max: number): [number, number] { const lo = Math.floor((min - 8) / 10) * 10; const hi = Math.ceil((max + 8) / 10) * 10; return [lo, hi === lo ? lo + 10 : hi]; }
const ticksOf = ([lo, hi]: [number, number]) => { const step = (hi - lo) / 3; return [hi, Math.round(lo + step * 2), Math.round(lo + step), lo]; };

export default function Health() {
  const t = useTheme();
  const router = useRouter();
  const { currentPatient, currentPatientId } = useCurrentPatient();
  const [type, setType] = useState<VitalType>('bp');
  const [range, setRange] = useState<7 | 30>(7);
  const [listFilter, setListFilter] = useState<'all' | 'abnormal'>('all');
  const vitals = useVitals(currentPatientId, type);

  // ดึงข้อมูลใหม่ตอนกลับเข้าหน้า (เช่น กลับจากหน้าบันทึกค่า)
  useFocusEffect(useCallback(() => {
    vitals.refetch();
  }, [currentPatientId, type]));

  if (!currentPatient) {
    return (
      <Screen>
        <Text variant="h1" weight="700" style={{ marginBottom: 20 }}>สุขภาพ</Text>
        <Card style={{ alignItems: 'center', paddingVertical: 28, marginTop: 8 }}>
          <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: t.colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <UserPlus size={26} color={t.colors.primaryStrong} strokeWidth={2} />
          </View>
          <Text variant="h2" weight="700" center style={{ marginBottom: 6 }}>เพิ่มผู้ป่วยก่อน</Text>
          <Text variant="body" color="ink3" center style={{ marginBottom: 16 }}>ต้องมีผู้ป่วยก่อนจึงจะบันทึกค่าสุขภาพได้</Text>
          <Button label="เพิ่มผู้ป่วย" onPress={() => router.push('/add-patient')} />
        </Card>
      </Screen>
    );
  }

  const readings = vitals.data ?? [];
  const latest = readings[0];
  const latestInfo = latest ? interpretVital(type, latest.value_json) : null;

  // แนวโน้ม: ค่าล่าสุดเทียบค่าเฉลี่ยก่อนหน้า
  const nums = readings.map((v) => vitalPrimary(type, v.value_json)).filter((n) => n > 0);
  const prevAvg = nums.length > 1 ? Math.round(nums.slice(1).reduce((a, b) => a + b, 0) / (nums.length - 1)) : null;
  const diff = prevAvg != null ? nums[0] - prevAvg : 0;
  const trendThresh = type === 'sugar' ? 5 : 3;
  const trend = prevAvg == null ? null
    : Math.abs(diff) < trendThresh ? { dir: 'flat' as const, text: 'ค่าค่อนข้างคงที่' }
    : diff > 0 ? { dir: 'up' as const, text: `สูงขึ้น ${Math.abs(diff)} จากค่าเฉลี่ยก่อนหน้า` }
    : { dir: 'down' as const, text: `ลดลง ${Math.abs(diff)} จากค่าเฉลี่ยก่อนหน้า` };

  const statusColor = (s: string) => (s === 'ok' ? t.colors.successInk : s === 'warn' ? t.colors.warningInk : t.colors.dangerInk);
  const statusBg = (s: string) => (s === 'ok' ? t.colors.successSoft : s === 'warn' ? t.colors.warningSoft : t.colors.dangerSoft);

  const editParams = (v: Vital) => {
    const j = v.value_json || {};
    const p: any = { id: v.id, type, at: v.taken_at };
    if (type === 'bp') { p.sys = String(j.sys ?? ''); p.dia = String(j.dia ?? ''); if (j.pulse) p.pulse = String(j.pulse); if (j.arm) p.arm = j.arm; if (j.position) p.position = j.position; }
    else { p.value = String(j.value ?? ''); if (j.context) p.context = j.context; }
    if (j.note) p.note = j.note;
    return p;
  };

  // รวมค่าเป็น "รายวัน" (เฉลี่ยต่อวัน) ภายในช่วง range วัน — จัดการการกรอกไม่เท่ากัน
  const cutoff = Date.now() - range * 86400000;
  const dayMap: Record<string, Vital[]> = {};
  for (const v of readings) {
    if (new Date(v.taken_at).getTime() < cutoff) continue;
    const d = new Date(v.taken_at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    (dayMap[key] ||= []).push(v);
  }
  const avg = (a: number[]) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0);
  const days = Object.values(dayMap).map((vs) => {
    const d0 = new Date(vs[0].taken_at);
    return {
      t: new Date(d0.getFullYear(), d0.getMonth(), d0.getDate()).getTime(),
      label: `${d0.getDate()}/${d0.getMonth() + 1}`,
      sys: avg(vs.map((v) => Number(v.value_json?.sys ?? 0)).filter((n) => n > 0)),
      dia: avg(vs.map((v) => Number(v.value_json?.dia ?? 0)).filter((n) => n > 0)),
      val: avg(vs.map((v) => vitalPrimary(type, v.value_json)).filter((n) => n > 0)),
    };
  }).sort((a, b) => a.t - b.t);

  let chart: React.ReactNode = null;
  if (days.length >= 2) {
    const step = Math.max(1, Math.ceil(days.length / 6));
    const xLabels = days.map((d, i) => (i === days.length - 1 || i % step === 0 ? d.label : ''));
    if (type === 'bp') {
      const sysArr = days.map((d) => d.sys);
      const diaArr = days.map((d) => d.dia);
      const domain = niceDomain(Math.min(...diaArr), Math.max(...sysArr));
      chart = <TrendChart xLabels={xLabels} domain={domain} yTicks={ticksOf(domain)} series={[{ label: 'ตัวบน (ซิสโตลิก)', color: t.blue[700], points: sysArr, endLabel: String(sysArr[sysArr.length - 1]) }, { label: 'ตัวล่าง (ไดแอสโตลิก)', color: t.blue[300], points: diaArr, endLabel: String(diaArr[diaArr.length - 1]) }]} />;
    } else {
      const arr = days.map((d) => d.val);
      const domain = niceDomain(Math.min(...arr), Math.max(...arr));
      chart = <TrendChart xLabels={xLabels} domain={domain} yTicks={ticksOf(domain)} series={[{ label: type === 'sugar' ? 'น้ำตาล' : 'หัวใจ', color: t.colors.primaryStrong, points: arr, endLabel: String(arr[arr.length - 1]) }]} />;
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <Text variant="h1" weight="700" style={{ marginBottom: 14 }}>สุขภาพ</Text>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Avatar name={currentPatient.name} photoUrl={currentPatient.photo_url} size={42} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" weight="700">{currentPatient.name}</Text>
            <Text variant="caption" color="ink3" numberOfLines={1}>{currentPatient.diseases || 'ยังไม่มีโรคประจำตัวที่ระบุ'}</Text>
          </View>
          {latestInfo ? (
            <View style={{ backgroundColor: statusBg(latestInfo.status), borderRadius: t.radius.pill, paddingVertical: 5, paddingHorizontal: 10 }}>
              <Text variant="micro" weight="700" style={{ color: statusColor(latestInfo.status) }}>{latestInfo.statusLabel}</Text>
            </View>
          ) : null}
        </Card>
        <View style={{ marginBottom: 14 }}>
          <SegmentedControl value={type} onChange={(v) => setType(v as VitalType)} options={[{ value: 'bp', label: 'ความดัน' }, { value: 'sugar', label: 'น้ำตาล' }, { value: 'hr', label: 'หัวใจ' }]} />
        </View>

        {vitals.isLoading ? (
          <ActivityIndicator color={t.colors.primary} style={{ marginTop: 30 }} />
        ) : readings.length === 0 ? (
          <EmptyState icon={<HeartPulse size={24} color={t.colors.ink3} strokeWidth={1.8} />} title="ยังไม่มีบันทึกค่า" description="แตะปุ่ม + เพื่อบันทึกค่าครั้งแรก" />
        ) : (
          <>
            <Card style={{ alignItems: 'center', paddingVertical: 20, marginBottom: 14 }}>
              <Text variant="caption" color="ink3">{latestInfo?.unit ? `ล่าสุด (${latestInfo.unit})` : 'ล่าสุด'}</Text>
              <Text variant="display" weight="700" style={{ marginVertical: 2 }}>{latestInfo?.display}</Text>
              {latestInfo ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: statusBg(latestInfo.status), borderRadius: t.radius.pill, paddingVertical: 5, paddingHorizontal: 12, marginTop: 2 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: statusColor(latestInfo.status) }} />
                  <Text variant="caption" weight="600" style={{ color: statusColor(latestInfo.status) }}>{latestInfo.statusLabel}</Text>
                </View>
              ) : null}
              {trend ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 }}>
                  {trend.dir === 'up' ? <TrendingUp size={14} color={t.colors.ink2} strokeWidth={2.2} /> : trend.dir === 'down' ? <TrendingDown size={14} color={t.colors.ink2} strokeWidth={2.2} /> : <Minus size={14} color={t.colors.ink2} strokeWidth={2.2} />}
                  <Text variant="micro" weight="600" color="ink2">แนวโน้ม: {trend.text}</Text>
                </View>
              ) : null}
              <Text variant="micro" color="ink3" style={{ marginTop: 6 }}>บันทึกเมื่อ {timeLabel(latest.taken_at)}{vitalContextLabel(latest.value_json) ? ` · ${vitalContextLabel(latest.value_json)}` : ''}</Text>
            </Card>

            {/* กราฟแนวโน้มเฉลี่ยรายวัน + สลับ 7/30 วัน */}
            {chart ? (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Text variant="caption" weight="700" color="ink2" style={{ flex: 1 }}>แนวโน้ม · เฉลี่ยรายวัน</Text>
                  {([7, 30] as const).map((r) => (
                    <Pressable key={r} onPress={() => setRange(r)} style={{ paddingVertical: 5, paddingHorizontal: 13, borderRadius: 999, backgroundColor: range === r ? t.colors.primary : t.colors.surface2, marginLeft: 6 }}>
                      <Text variant="micro" weight="700" style={{ color: range === r ? '#fff' : t.colors.ink2 }}>{r} วัน</Text>
                    </Pressable>
                  ))}
                </View>
                {chart}
                {type === 'bp' ? (
                  <Text variant="micro" color="ink3" style={{ marginTop: 8, lineHeight: 17 }}>
                    ตัวบน (ซิสโตลิก) = ความดันช่วงหัวใจบีบตัว · ตัวล่าง (ไดแอสโตลิก) = ช่วงหัวใจคลายตัว
                  </Text>
                ) : null}
              </View>
            ) : readings.length >= 1 ? (
              <Text variant="caption" color="ink3" style={{ marginTop: 4 }}>บันทึกอย่างน้อย 2 วันจึงจะแสดงกราฟแนวโน้ม</Text>
            ) : null}

            {/* คำแนะนำตามเกณฑ์มาตรฐาน */}
            {latestInfo ? (
              <View style={{ flexDirection: 'row', gap: 11, backgroundColor: statusBg(latestInfo.status), borderRadius: t.radius.lg, padding: 14, marginTop: 14 }}>
                <Lightbulb size={20} color={statusColor(latestInfo.status)} strokeWidth={2} style={{ marginTop: 1 }} />
                <View style={{ flex: 1 }}>
                  <Text variant="caption" weight="700" style={{ color: statusColor(latestInfo.status), marginBottom: 3 }}>คำแนะนำ</Text>
                  <Text variant="caption" color="ink2" style={{ lineHeight: 20 }}>{vitalAdvice(type, latestInfo.status)}</Text>
                  <Text variant="micro" color="ink3" style={{ marginTop: 6 }}>{vitalNormalRange(type)}</Text>
                </View>
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18, marginBottom: 10 }}>
              <Text variant="title" weight="700" style={{ flex: 1 }}>บันทึกล่าสุด</Text>
              {([['all', 'ทั้งหมด'], ['abnormal', 'เฉพาะผิดปกติ']] as const).map(([key, label]) => {
                const active = listFilter === key;
                const abnormalCount = key === 'abnormal' ? readings.filter((v) => interpretVital(type, v.value_json).status !== 'ok').length : 0;
                return (
                  <Pressable key={key} onPress={() => setListFilter(key)} style={{ paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999, backgroundColor: active ? t.colors.primary : t.colors.surface2, marginLeft: 6 }}>
                    <Text variant="micro" weight="700" style={{ color: active ? '#fff' : t.colors.ink2 }}>{label}{key === 'abnormal' ? ` ${abnormalCount}` : ''}</Text>
                  </Pressable>
                );
              })}
            </View>
            {(() => {
              const filtered = (listFilter === 'abnormal' ? readings.filter((v) => interpretVital(type, v.value_json).status !== 'ok') : readings).slice(0, 12);
              if (filtered.length === 0) {
                return <Text variant="caption" color="ink3" style={{ marginTop: 2, marginBottom: 8 }}>ไม่มีค่าที่ผิดปกติในบันทึกล่าสุด — เป็นสัญญาณที่ดี</Text>;
              }
              return filtered.map((v: Vital) => {
              const info = interpretVital(type, v.value_json);
              const ctx = vitalContextLabel(v.value_json);
              return (
                <Pressable key={v.id} onPress={() => router.push({ pathname: '/add-vital', params: editParams(v) })}>
                  <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, paddingVertical: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong" weight="600">{info.display} {info.unit}</Text>
                      <Text variant="caption" color="ink3">{timeLabel(v.taken_at)}{ctx ? ` · ${ctx}` : ''}</Text>
                    </View>
                    <View style={{ backgroundColor: statusBg(info.status), borderRadius: t.radius.pill, paddingVertical: 5, paddingHorizontal: 11 }}>
                      <Text variant="caption" weight="600" style={{ color: statusColor(info.status) }}>{info.statusLabel}</Text>
                    </View>
                    <ChevronRight size={16} color={t.colors.ink3} strokeWidth={2.2} />
                  </Card>
                </Pressable>
              );
              });
            })()}
          </>
        )}
      </Screen>

      <Pressable onPress={() => router.push({ pathname: '/add-vital', params: { type } })} style={{ position: 'absolute', right: 18, bottom: 24, width: 56, height: 56, borderRadius: 18, backgroundColor: t.colors.primary, alignItems: 'center', justifyContent: 'center', ...t.shadows.e3 }}>
        <Plus size={26} color="#FFFFFF" strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}
