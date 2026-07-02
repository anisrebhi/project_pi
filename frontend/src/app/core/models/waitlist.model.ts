import { TicketTypeName } from './event.model';
import { EventModel } from './event.model';

export type WaitlistStatus = 'waiting' | 'notified' | 'promoted' | 'expired' | 'removed';

export interface WaitlistEntry {
  _id: string;
  user: string;
  event: EventModel | string;
  ticketType?: TicketTypeName | null;
  numberOfTickets: number;
  status: WaitlistStatus;
  position?: number;
  notifiedAt?: string | null;
  promotedAt?: string | null;
  reservation?: string | null;
  createdAt?: string;
}

export interface JoinWaitlistInput {
  eventId: string;
  numberOfTickets?: number;
  ticketType?: TicketTypeName;
}

export interface WaitlistPositionResult {
  onWaitlist: boolean;
  position?: number;
  total?: number;
  entry?: WaitlistEntry;
}
