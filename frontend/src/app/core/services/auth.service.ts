import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AuthResponse, User, UserRole } from '../models/user.model';

const TOKEN_KEY = 'era_token';
const USER_KEY = 'era_user';

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  /** Reactive signal holding the currently authenticated user (or null) */
  readonly currentUser = signal<User | null>(this.readStoredUser());

  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');
  readonly isOrganizer = computed(() => this.currentUser()?.role === 'ORGANIZER');

  constructor(private http: HttpClient) {}

  login(payload: LoginInput): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, payload).pipe(
      tap((res) => this.persistSession(res.data)),
    );
  }

  register(payload: RegisterInput): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, payload).pipe(
      tap((res) => this.persistSession(res.data)),
    );
  }

  fetchMe(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/me`).pipe(
      tap((res) => {
        this.currentUser.set(res.data);
        localStorage.setItem(USER_KEY, JSON.stringify(res.data));
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  hasRole(...roles: UserRole[]): boolean {
    const role = this.currentUser()?.role;
    return !!role && roles.includes(role);
  }

  private persistSession(data: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    this.currentUser.set(data.user);
  }

  private readStoredUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
