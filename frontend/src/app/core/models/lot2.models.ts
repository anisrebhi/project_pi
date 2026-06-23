/**
 * @file core/models/lot2.models.ts
 * @description TypeScript interfaces for Lot-2 features:
 *   Certificate · Review · Message · EventPhoto · Recommendation
 */

// ─── Certificate ──────────────────────────────────────────────────────────────
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
}

export interface CertificateVerification {
  valid: boolean;
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
}
