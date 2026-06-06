import type { RoiParams } from './types';

// Экономика одного обращения и проекция на месяц.
// Считаем честно: экономия на обработке + предотвращённые потери от пропущенных звонков.

const WORK_DAYS = 22;

export interface RoiPerCall {
  aiCost: number;
  humanCost: number;
  savedPerCall: number;
}

export function perCall(roi: RoiParams): RoiPerCall {
  return {
    aiCost: roi.aiCostPerCall,
    humanCost: roi.humanCostPerCall,
    savedPerCall: Math.max(0, roi.humanCostPerCall - roi.aiCostPerCall),
  };
}

export interface MonthlyRoi {
  callsPerMonth: number;
  laborSaving: number; // экономия на обработке
  missedSaving: number; // предотвращённые потери (доля пропущенных, которую ловит ИИ)
  total: number;
}

// Доля звонков, которые живой отдел пропускает (вне часов, занято, не перезвонили).
// ИИ ловит их 24/7 — это и есть предотвращённые потери.
const MISSED_RATE = 0.25;

export function monthly(roi: RoiParams, callsPerDay: number): MonthlyRoi {
  const callsPerMonth = Math.round(callsPerDay * WORK_DAYS);
  const laborSaving = callsPerMonth * Math.max(0, roi.humanCostPerCall - roi.aiCostPerCall);
  const missedSaving = Math.round(callsPerMonth * MISSED_RATE * roi.missedCallValue);
  return {
    callsPerMonth,
    laborSaving,
    missedSaving,
    total: laborSaving + missedSaving,
  };
}

export function formatRub(n: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n) + ' ₽';
}
