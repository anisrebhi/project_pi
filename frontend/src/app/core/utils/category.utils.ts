import { EventCategory } from '../models/event.model';

export interface CategoryMeta {
  value: EventCategory | '';
  label: string;
  icon: string;
  emoji: string;
  color: string;
<<<<<<< HEAD
  gradient: string;
  bgLight: string;
  svgIcon: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    value: '',
    label: 'Tous',
    icon: 'dashboard',
    emoji: '🎯',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg,#6366f1,#818cf8)',
    bgLight: '#ede9fe',
    svgIcon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
  },
  {
    value: 'conference',
    label: 'Conférence',
    icon: 'record_voice_over',
    emoji: '🎤',
    color: '#4f46e5',
    gradient: 'linear-gradient(135deg,#4f46e5,#6366f1)',
    bgLight: '#eef2ff',
    svgIcon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10a7 7 0 0 1-14 0M12 19v3M8 22h8"/></svg>`,
  },
  {
    value: 'workshop',
    label: 'Atelier',
    icon: 'build_circle',
    emoji: '🛠️',
    color: '#059669',
    gradient: 'linear-gradient(135deg,#059669,#10b981)',
    bgLight: '#d1fae5',
    svgIcon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z"/></svg>`,
  },
  {
    value: 'meeting',
    label: 'Réunion',
    icon: 'groups',
    emoji: '🤝',
    color: '#0284c7',
    gradient: 'linear-gradient(135deg,#0284c7,#38bdf8)',
    bgLight: '#e0f2fe',
    svgIcon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  },
  {
    value: 'sport',
    label: 'Sport',
    icon: 'sports_soccer',
    emoji: '⚽',
    color: '#d97706',
    gradient: 'linear-gradient(135deg,#d97706,#f59e0b)',
    bgLight: '#fef3c7',
    svgIcon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 7.07 17.07M12 2v4m0 16v-4M2 12h4m16 0h-4m-9.07-7.07L6 7.93m10.07 8.14 2.93 2.93"/></svg>`,
  },
  {
    value: 'other',
    label: 'Autre',
    icon: 'category',
    emoji: '✨',
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
    bgLight: '#ede9fe',
    svgIcon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
  },
=======
}

export const CATEGORIES: CategoryMeta[] = [
  { value: '',           label: 'Toutes',       icon: 'apps',            emoji: '🎯', color: '#6366f1' },
  { value: 'conference', label: 'Conférence',   icon: 'record_voice_over', emoji: '🎤', color: '#4b3fe4' },
  { value: 'workshop',   label: 'Atelier',      icon: 'build',           emoji: '🛠️', color: '#059669' },
  { value: 'meeting',    label: 'Réunion',      icon: 'groups',          emoji: '🤝', color: '#0284c7' },
  { value: 'sport',      label: 'Sport',        icon: 'sports_soccer',   emoji: '⚽', color: '#d97706' },
  { value: 'other',      label: 'Autre',        icon: 'category',        emoji: '📌', color: '#7c3aed' },
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
];

export const FILTER_CATEGORIES = CATEGORIES;
export const FORM_CATEGORIES   = CATEGORIES.filter(c => c.value !== '');

export function getCategoryMeta(value: string | undefined | null): CategoryMeta {
  return CATEGORIES.find(c => c.value === value) ?? CATEGORIES[0];
}
<<<<<<< HEAD
export function getCategoryEmoji(value: string | undefined | null): string {
  return getCategoryMeta(value).emoji;
}
export function getCategoryLabel(value: string | undefined | null): string {
  return getCategoryMeta(value).label;
}
export function getCategoryColor(value: string | undefined | null): string {
  return getCategoryMeta(value).color;
}
export function getCategoryGradient(value: string | undefined | null): string {
  return getCategoryMeta(value).gradient;
}
export function getCategoryBgLight(value: string | undefined | null): string {
  return getCategoryMeta(value).bgLight;
}
=======

export function getCategoryEmoji(value: string | undefined | null): string {
  return getCategoryMeta(value).emoji;
}

export function getCategoryLabel(value: string | undefined | null): string {
  return getCategoryMeta(value).label;
}
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
