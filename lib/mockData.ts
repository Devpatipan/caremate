/**
 * Mock data — stand-ins for Supabase queries.
 * Replace each export with a react-query hook backed by the Supabase
 * client (see README "การต่อ Supabase") when wiring the backend.
 */

export type DoseStatus = 'taken' | 'due' | 'waiting' | 'missed' | 'snoozed';

export type Dose = {
  id: string;
  time: string;
  period: string;
  medName: string;
  detail: string;
  status: DoseStatus;
  statusLabel: string;
};

export type VitalType = 'bp' | 'sugar' | 'hr';

export const patient = {
  id: 'p1',
  name: 'คุณแม่ สมหญิง ใจดี',
  shortName: 'คุณแม่ สมหญิง',
  initial: 'ม',
  age: 72,
  bloodType: 'O',
  diseases: 'เบาหวาน, ความดัน',
};

export const todayMed = {
  taken: 2,
  total: 4,
  adherence7d: 92,
  nextDose: { time: '12:00', name: 'ยาความดัน' },
};

export const doses: Dose[] = [
  {
    id: 'd1',
    time: '07:30',
    period: 'เช้า',
    medName: 'ยาลดความดัน',
    detail: 'Amlodipine 5mg · 1 เม็ด',
    status: 'taken',
    statusLabel: 'ทานแล้ว',
  },
  {
    id: 'd2',
    time: '12:00',
    period: 'เที่ยง',
    medName: 'ยาเบาหวาน',
    detail: 'Metformin 500mg · หลังอาหาร',
    status: 'due',
    statusLabel: 'อีก 2 ชม.',
  },
  {
    id: 'd3',
    time: '18:00',
    period: 'เย็น',
    medName: 'ยาลดความดัน',
    detail: 'Amlodipine 5mg · 1 เม็ด',
    status: 'waiting',
    statusLabel: 'รอ',
  },
  {
    id: 'd4',
    time: '21:00',
    period: 'ก่อนนอน',
    medName: 'ยานอนหลับ',
    detail: '1 เม็ด ก่อนนอน',
    status: 'waiting',
    statusLabel: 'รอ',
  },
];

export const vitals = {
  bp: { value: '128/82', unit: 'มม.ปรอท', status: 'ok' as const, takenAt: '07:15 น. วันนี้ · จากกล่อง' },
  sugar: { value: '110', unit: 'mg/dL', status: 'ok' as const, takenAt: 'เมื่อวาน' },
  hr: { value: '72', unit: 'bpm', status: 'ok' as const, takenAt: '2 ชม.ที่แล้ว' },
};

export const bpTrend = {
  xLabels: ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'],
  systolic: [130, 127, 133, 124, 129, 122, 128],
  diastolic: [84, 82, 86, 80, 83, 79, 82],
};

export const bpReadings = [
  { id: 'r1', value: '128 / 82', when: 'วันนี้ 07:15 · จากกล่อง', status: 'ok' as const, label: 'ปกติ' },
  { id: 'r2', value: '135 / 88', when: 'เมื่อวาน 07:20', status: 'warn' as const, label: 'เฝ้าระวัง' },
  { id: 'r3', value: '126 / 80', when: '2 วันก่อน 07:05', status: 'ok' as const, label: 'ปกติ' },
];

export const nextAppointment = {
  day: '25',
  month: 'ส.ค.',
  title: 'พบแพทย์ · อายุรกรรม',
  detail: '09:30 น. · รพ.ศรีสะเกษ',
};

export const device = {
  name: 'กล่องเตือนยา — ห้องคุณแม่',
  model: 'KidBright32',
  online: true,
  lastSeen: '20 วินาทีที่แล้ว',
  signal: 'สัญญาณดี',
  soundProfile: 'voice_th',
};

export type SoundOption = { id: string; name: string; detail: string };
export const soundOptions: SoundOption[] = [
  { id: 'voice_th', name: 'เสียงพูดไทย', detail: '“ถึงเวลาทานยาแล้วค่ะ”' },
  { id: 'buzzer', name: 'เสียงติ๊ด (Buzzer)', detail: 'เสียงบี๊บเป็นจังหวะ' },
  { id: 'custom', name: 'เสียงลูกหลานอัดเอง', detail: 'อัดข้อความเสียงของคุณ' },
];

export type AlertItem = {
  id: string;
  type: 'missed' | 'vital' | 'taken' | 'appointment' | 'offline' | 'info';
  title: string;
  detail: string;
  time: string;
  day: 'today' | 'yesterday';
  unread: boolean;
};

export const alerts: AlertItem[] = [
  {
    id: 'a1',
    type: 'missed',
    title: 'ยังไม่ทานยา 07:30',
    detail: 'คุณแม่สมหญิง ยังไม่กดยืนยันที่กล่อง เกิน 15 นาที',
    time: '08:45',
    day: 'today',
    unread: true,
  },
  {
    id: 'a2',
    type: 'vital',
    title: 'ความดันสูงกว่าปกติ',
    detail: 'วัดได้ 135/88 เมื่อวานเช้า — แนะนำติดตาม',
    time: '07:20',
    day: 'today',
    unread: true,
  },
  {
    id: 'a3',
    type: 'taken',
    title: 'ทานยาเช้าแล้ว',
    detail: 'ยืนยันที่กล่อง 06:32 — ยาลดความดัน',
    time: '06:32',
    day: 'today',
    unread: false,
  },
  {
    id: 'a4',
    type: 'appointment',
    title: 'ใกล้ถึงนัดหมาย',
    detail: 'พบแพทย์ 25 ส.ค. 09:30 · รพ.ศรีสะเกษ',
    time: '18:00',
    day: 'yesterday',
    unread: false,
  },
  {
    id: 'a5',
    type: 'offline',
    title: 'กล่องออฟไลน์ชั่วคราว',
    detail: 'ขาดการเชื่อมต่อ 12 นาที แล้วกลับมาปกติ',
    time: '14:10',
    day: 'yesterday',
    unread: false,
  },
];
