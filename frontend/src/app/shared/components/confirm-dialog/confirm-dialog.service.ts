import { Injectable, signal } from '@angular/core';

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ActiveConfirm extends ConfirmRequest {
  resolve: (value: boolean) => void;
}

/**
 * Lightweight app-wide confirmation modal, used instead of window.confirm()
 * for a consistent visual style (e.g. "Delete this event?",
 * "Cancel this reservation?").
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly active = signal<ActiveConfirm | null>(null);

  ask(request: ConfirmRequest): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.active.set({ ...request, resolve });
    });
  }

  resolve(result: boolean): void {
    const current = this.active();
    if (!current) return;
    current.resolve(result);
    this.active.set(null);
  }
}
