import { EventCategory } from '../models/event.model';

export interface CategoryMeta {
  value: EventCategory | '';
  label: string;
  icon: string;
  emoji: string;
  color: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { value: '',           label: 'Toutes',       icon: 'apps',            emoji: '🎯', color: '#6366f1' },
  { value: 'conference', label: 'Conférence',   icon: 'record_voice_over', emoji: '🎤', color: '#4b3fe4' },
  { value: 'workshop',   label: 'Atelier',      icon: 'build',           emoji: '🛠️', color: '#059669' },
  { value: 'meeting',    label: 'Réunion',      icon: 'groups',          emoji: '🤝', color: '#0284c7' },
  { value: 'sport',      label: 'Sport',        icon: 'sports_soccer',   emoji: '⚽', color: '#d97706' },
  { value: 'other',      label: 'Autre',        icon: 'category',        emoji: '📌', color: '#7c3aed' },
];

export const FILTER_CATEGORIES = CATEGORIES;
export const FORM_CATEGORIES   = CATEGORIES.filter(c => c.value !== '');

export function getCategoryMeta(value: string | undefined | null): CategoryMeta {
  return CATEGORIES.find(c => c.value === value) ?? CATEGORIES[0];
}

export function getCategoryEmoji(value: string | undefined | null): string {
  return getCategoryMeta(value).emoji;
}

export function getCategoryLabel(value: string | undefined | null): string {
  return getCategoryMeta(value).label;
}
