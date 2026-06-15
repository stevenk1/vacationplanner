export interface Category {
  value: string;
  label: string;
  emoji: string;
}

export const CATEGORIES: Category[] = [
  { value: 'sightseeing', label: 'Sightseeing', emoji: '📸' },
  { value: 'food', label: 'Food & Drink', emoji: '🍝' },
  { value: 'nature', label: 'Nature', emoji: '🌅' },
  { value: 'culture', label: 'Culture', emoji: '🏛️' },
  { value: 'activity', label: 'Activity', emoji: '🚣' },
  { value: 'landmark', label: 'Landmark', emoji: '⛪' },
  { value: 'beach', label: 'Beach', emoji: '🏖️' },
  { value: 'other', label: 'Other', emoji: '📍' },
];

const BY_VALUE = new Map(CATEGORIES.map((c) => [c.value, c]));

export function categoryEmoji(value?: string): string {
  return (value && BY_VALUE.get(value)?.emoji) || '📍';
}

export function categoryLabel(value?: string): string {
  return (value && BY_VALUE.get(value)?.label) || 'Place';
}
