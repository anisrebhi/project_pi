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

export interface EventAttachment {
  name: string;
  url: string;
}

export interface EventStats {
  confirmed: number;
  pending: number;
  cancelled: number;
}

export interface ConfirmedReservation {
  _id: string;
  user: { _id: string; fullName: string; email: string; profileImage?: string };
  numberOfTickets: number;
  ticketType?: string;
  status: string;
  reservationDate: string;
}

export interface EventModel {
  _id: string;
  title: string;
  description?: string;
  location?: EventLocation;
  participationMode?: 'in-person' | 'online' | 'hybrid';
  videoConferenceLink?: string;
  tags?: string[];
  conditions?: string;
  attachments?: EventAttachment[];
  startDate: string;
  endDate: string;
  category?: EventCategory;
  capacity: number;
  organizer: EventOrganizer | string;
  participants: string[];
  isActive: boolean;
  status?: 'draft' | 'published' | 'active' | 'cancelled' | string;
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
  _bookedTickets?: number;
  _hasReservation?: boolean;
  _reservationStats?: EventStats;
  _totalReservations?: number;
  _certificateCount?: number;
  _hasCertificates?: boolean;
  _confirmedParticipants?: ConfirmedReservation[];
  _waitlistCount?: number;
  _fillRate?: number;
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

/** Compute available spots defensively — prefers _bookedTickets (real aggregate) over virtuals that count unique users. */
export function computeAvailableSpots(event: EventModel): number {
  const booked = event._bookedTickets ?? event.participantCount ?? event.participants?.length ?? 0;
  return Math.max(0, event.capacity - booked);
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
