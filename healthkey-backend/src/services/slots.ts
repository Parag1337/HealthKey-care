import { IAvailabilityDoc, WorkingDay } from '../models/Availability.js';

export interface Slot {
  date: string;
  startTime: string;
  endTime: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function toClock(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}-${m}-${d}`;
}

export function isDateKeyBeforeToday(key: string): boolean {
  return key < dateKey(new Date());
}

export function slotKey(doctorId: string, date: string, startTime: string): string {
  return `${doctorId}:${date}:${startTime}`;
}

export function toWeekDay(date: Date): string {
  return date.toDateString().slice(0, 3).toUpperCase();
}

function overlapsBreak(start: number, end: number, breaks: { start: string; end: string }[]): boolean {
  return breaks.some((b) => {
    const bs = toMinutes(b.start);
    const be = toMinutes(b.end);
    return start >= bs && end <= be;
  });
}

// Generate all slots for one day from availability rules (ignores bookings)
export function generateDaySlots(
  availability: IAvailabilityDoc,
  date: Date,
  type: 'in_person' | 'online',
  opts?: { bookedSlots?: Set<string>; doctorId?: string }
): Slot[] {
  const key = dateKey(date);

  if (availability.blockedDates?.some((b) => dateKey(new Date(b)) === key)) {
    return [];
  }

  const weekday = toWeekDay(date);
  const day: WorkingDay | undefined = availability.workingDays?.find((d) => d.day === weekday);
  if (!day) return [];

  if (day.consultationTypes && !day.consultationTypes.includes(type)) {
    return [];
  }

  const start = toMinutes(day.start);
  const end = toMinutes(day.end);
  const duration = day.slotDurationMinutes || 30;
  const booked = opts?.bookedSlots || new Set<string>();
  const docId = opts?.doctorId;

  const slots: Slot[] = [];
  for (let t = start; t + duration <= end; t += duration) {
    if (overlapsBreak(t, t + duration, day.breaks || [])) continue;
    const startTime = toClock(t);
    if (docId && booked.has(slotKey(docId, key, startTime))) continue;
    slots.push({ date: key, startTime, endTime: toClock(t + duration) });
  }
  return slots;
}

// Generate slots for a window of days and check availability against real bookings
export async function generateSlotsFromDb(
  availability: IAvailabilityDoc,
  fromDate: Date,
  countDays: number,
  doctorId: string,
  type: 'in_person' | 'online',
  booked: Set<string>
): Promise<Slot[]> {
  const all: Slot[] = [];
  for (let i = 0; i < countDays; i++) {
    const date = addDays(fromDate, i);
    all.push(...generateDaySlots(availability, date, type, { bookedSlots: booked, doctorId }));
  }
  return all;
}