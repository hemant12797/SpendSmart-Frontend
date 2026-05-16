import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = environment.categoryApi;

  constructor(private http: HttpClient) { }

  getCategories(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/allForUser/${userId}`);
  }

  getDefaultCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/defaults`);
  }
}
