import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IncomeService {
  private apiUrl = environment.incomeApi;

  constructor(private http: HttpClient) { }

  getIncomes(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}`);
  }

  addIncome(income: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, income);
  }

  deleteIncome(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
