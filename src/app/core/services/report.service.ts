import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = environment.reportApi;

  constructor(private http: HttpClient) { }

  getReports(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}`);
  }

  generateReport(request: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/generate`, request);
  }

  getDownloadUrl(reportId: number): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.apiUrl}/${reportId}/download`);
  }

  deleteReport(reportId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${reportId}`);
  }

  clearHistory(): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/history`);
  }
}
