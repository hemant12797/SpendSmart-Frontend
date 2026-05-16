import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private apiUrl = environment.budgetApi;
  private refreshSubject = new Subject<void>();

  refresh$ = this.refreshSubject.asObservable();

  constructor(private http: HttpClient) { }

  triggerRefresh() {
    this.refreshSubject.next();
  }

  getBudgets(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}`);
  }

  createBudget(budget: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, budget).pipe(
      tap(() => this.triggerRefresh())
    );
  }

  deleteBudget(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.triggerRefresh())
    );
  }
}
