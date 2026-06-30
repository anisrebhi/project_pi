/**
 * @file core/models/lot2.models.ts
 * @description TypeScript interfaces for Lot-2 features:
 *   Certificate · Review · Message · EventPhoto · Recommendation
 */

// ─── Certificate ──────────────────────────────────────────────────────────────
<<<<<<< HEAD
export type CertificateStatus = 'pending' | 'validated' | 'sent' | 'downloaded';

export interface CertUser {
  _id: string;
  fullName: string;
  email: string;
}

export interface CertEvent {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  location?: { address?: string };
  organizer?: { _id: string; fullName: string };
  category?: string;
}

export interface Certificate {
  _id: string;
  user: string | CertUser;
  event: string | CertEvent;
  reservation: string;
  verificationCode: string;
  status: CertificateStatus;
  validatedBy?: string | { _id: string; fullName: string } | null;
  validatedAt?: string | null;
  issuedAt: string;
  emailSentAt?: string | null;
  downloadedAt?: string | null;
  downloadCount?: number;
  createdAt: string;
  updatedAt?: string;
=======
export interface Certificate {
  _id: string;
  user: string | { _id: string; fullName: string; email: string };
  event: {
    _id: string;
    title: string;
    startDate: string;
    endDate: string;
    location?: { address?: string };
    organizer?: { _id: string; fullName: string };
  };
  verificationCode: string;
  issuedAt: string;
  emailSentAt?: string;
  createdAt: string;
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
}

export interface CertificateVerification {
  valid: boolean;
<<<<<<< HEAD
  verificationCode: string;
  issuedAt: string;
  validatedAt?: string;
  holder: string;
  holderEmail?: string;
  event: string;
  eventDate: string;
  eventEndDate?: string;
  status: CertificateStatus;
  downloadCount?: number;
}

// ─── Review ───────────────────────────────────────────────────────────────────
export interface ReviewUser  { _id: string; fullName: string; }
export interface Review      { _id: string; event: string; user: ReviewUser; rating: number; comment?: string; createdAt: string; }
export interface ReviewInput { eventId: string; rating: number; comment?: string; }
export interface ReviewStats { reviews: Review[]; total: number; avgRating: number; }

// ─── Message ──────────────────────────────────────────────────────────────────
export interface ChatSender  { _id: string; fullName: string; role: string; }
export interface ChatMessage { _id: string; event: string | { _id: string }; sender: ChatSender; content: string; readBy: string[]; createdAt: string; }

// ─── Event Photo ──────────────────────────────────────────────────────────────
export interface EventPhoto { _id: string; event: string; uploadedBy: { _id: string; fullName: string }; url: string; filename: string; caption?: string; originalName?: string; createdAt: string; }

// ─── Recommendation ───────────────────────────────────────────────────────────
export interface RecommendationResult { events: any[]; basedOn: string[]; }

// ─── Confirmed Participant (certificate preview) ───────────────────────────────
export interface ConfirmedParticipant {
  userId:          string;
  fullName:        string;
  email:           string;
  profileImage:    string | null;
  reservationId:   string;
  reservedAt:      string;
  ticketType:      string | null;
  numberOfTickets: number;
  hasCertificate:  boolean;
  certStatus:      string | null;
  certCode:        string | null;
=======
  issuedAt: string;
  holder: string;
  event: string;
  eventDate: string;
}

// ─── Review ───────────────────────────────────────────────────────────────────
export interface Review {
  _id: string;
  event: string;
  user: { _id: string; fullName: string };
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface ReviewInput {
  eventId: string;
  rating: number;
  comment?: string;
}

export interface ReviewStats {
  reviews: Review[];
  total: number;
  avgRating: number;
}

// ─── Message ──────────────────────────────────────────────────────────────────
export interface ChatMessage {
  _id: string;
  event: string;
  sender: { _id: string; fullName: string; role: string };
  content: string;
  readBy: string[];
  createdAt: string;
}

// ─── Event Photo ──────────────────────────────────────────────────────────────
export interface EventPhoto {
  _id: string;
  event: string;
  uploadedBy: { _id: string; fullName: string };
  url: string;
  filename: string;
  caption?: string;
  originalName?: string;
  createdAt: string;
}

// ─── Recommendation ───────────────────────────────────────────────────────────
export interface RecommendationResult {
  events: any[];
  basedOn: string[];
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
}
