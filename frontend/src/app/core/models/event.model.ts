export type EventCategory = 'conference' | 'workshop' | 'meeting' | 'sport' | 'other';
export type EventType = 'free' | 'paid';
export type TicketTypeName = 'Standard' | 'VIP' | 'Premium' | 'Etudiant';

export const TICKET_TYPE_NAMES: TicketTypeName[] = ['Standard', 'VIP', 'Premium', 'Etudiant'];

export interface EarlyBird {
  enabled: boolean;
  price?: number | null;
  deadline?: string | null;
}

export interface TicketType {
  name: TicketTypeName;
  price: number;
  quantity?: number | null;
  earlyBird?: EarlyBird;
}

export interface EventLocation {
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface EventImage {
  url: string;
  filename?: string;
  isUploaded?: boolean;
}

export interface EventOrganizer {
  _id: string;
  fullName: string;
  email: string;
}

export interface EventModel {
  _id: string;
  title: string;
  description?: string;
  location?: EventLocation;
  startDate: string;
  endDate: string;
  category?: EventCategory;
  capacity: number;
  organizer: EventOrganizer | string;
  participants: string[];
  isActive: boolean;
  type: EventType;
  price: number;
  ticketTypes?: TicketType[];
  maxTicketsPerUser?: number;
  images?: EventImage[];
  qrCode?: string | null;
  participantCount?: number;
  availableSpots?: number;
  isFull?: boolean;
  isPast?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Payload sent to the API when creating/updating an event */
export interface EventInput {
  title: string;
  description?: string;
  location?: EventLocation;
  startDate: string;
  endDate: string;
  category?: EventCategory;
  capacity: number;
  type: EventType;
  price?: number;
  ticketTypes?: TicketType[];
  maxTicketsPerUser?: number;
  images?: Array<{ url: string }>;
}

/** Helper to get the first image URL of an event */
export function getEventImageUrl(event: EventModel): string | null {
  return event.images?.[0]?.url ?? null;
}

/** Compute available spots defensively (backend lean() loses virtuals) */
export function computeAvailableSpots(event: EventModel): number {
  if (event.availableSpots !== undefined) return event.availableSpots;
  const count = event.participantCount ?? event.participants?.length ?? 0;
  return Math.max(0, event.capacity - count);
}

export function computeIsFull(event: EventModel): boolean {
  return computeAvailableSpots(event) <= 0;
}

export interface EventQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: EventCategory | '';
  type?: EventType | '';
  startFrom?: string;
  startTo?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}
