import { EventModel, TicketTypeName } from './event.model';
import { User } from './user.model';

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

export interface ReservationUser {
  _id: string;
  fullName: string;
  email: string;
  phone?: string | null;
}

export interface ReservationEvent {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  category?: string;
  type?: string;
  price?: number;
  location?: EventModel['location'];
}

export interface Reservation {
  _id: string;
  user: ReservationUser | string;
  event: ReservationEvent | string;
  numberOfTickets: number;
  ticketType?: TicketTypeName | null;
  unitPrice?: number;
  isEarlyBird?: boolean;
  promoCode?: string | null;
  discountAmount?: number;
  totalPrice: number;
  status: ReservationStatus;
  qrCode?: string | null;
  confirmationSentAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateReservationInput {
  eventId: string;
  numberOfTickets: number;
  ticketType?: TicketTypeName;
  promoCode?: string;
  userId?: string; // ADMIN only
}

export interface ReservationQueryParams {
  page?: number;
  limit?: number;
  status?: ReservationStatus | '';
  eventId?: string;
  userId?: string;
}

export interface ReservationNotification {
  qrGenerated: boolean;
  emailSent: boolean;
}
