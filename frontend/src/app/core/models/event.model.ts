export type EventCategory = 'conference' | 'workshop' | 'meeting' | 'sport' | 'other';
export type EventType = 'free' | 'paid';

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
