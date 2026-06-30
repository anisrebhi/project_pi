export type UserRole = 'ADMIN' | 'ORGANIZER' | 'PARTICIPANT';

export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  profileImage?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
