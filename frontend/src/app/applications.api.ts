import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export const STATUS_LABELS: Record<string, string> = {
  TO_APPLY: 'À contacter',
  SENT: 'Envoyée',
  INTERVIEW: 'Entretien',
  OFFER: 'Offre',
  REJECTED: 'Refus',
};

export interface Application {
  _id: string;
  company: string;
  position: string;
  offerUrl?: string | null;
  status: string;
  appliedAt?: string | null;
  notes?: string | null;
}

export type ApplicationInput = Omit<Application, '_id'>;

@Injectable({ providedIn: 'root' })
export class ApplicationsApi {
  private http = inject(HttpClient);

  list() {
    return this.http.get<Application[]>('/api/applications');
  }
  create(body: ApplicationInput) {
    return this.http.post<Application>('/api/applications', body);
  }
  update(id: string, body: ApplicationInput) {
    return this.http.put<Application>(`/api/applications/${id}`, body);
  }
  remove(id: string) {
    return this.http.delete<void>(`/api/applications/${id}`);
  }
}
