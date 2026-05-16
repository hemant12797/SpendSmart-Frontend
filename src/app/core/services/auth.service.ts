import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.authApi;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) { }

  public getApiUrl(): string {
    return this.apiUrl;
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  public getUserId(): number {
    const token = localStorage.getItem('token');
    if (!token) return 0;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const id = payload.UserId 
              || payload.nameid 
              || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] 
              || '0';
      return parseInt(id, 10);
    } catch {
      return 0;
    }
  }

  public getUserName(): string {
    const token = localStorage.getItem('token');
    if (!token) return 'User';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.unique_name 
          || payload.name 
          || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']
          || payload.email 
          || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']
          || 'User';
    } catch {
      return 'User';
    }
  }

  public isAdmin(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role 
                || payload.Role 
                || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      return role === 'Admin';
    } catch {
      return false;
    }
  }

  login(credentials: any) {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response && response.token) {
          localStorage.setItem('token', response.token);
          this.isAuthenticatedSubject.next(true);
        }
      })
    );
  }

  googleLogin(idToken: string) {
    return this.http.post<any>(`${this.apiUrl}/google-login`, { idToken }).pipe(
      tap(response => {
        if (response && response.token) {
          localStorage.setItem('token', response.token);
          this.isAuthenticatedSubject.next(true);
        }
      })
    );
  }

  register(user: any) {
    return this.http.post<any>(`${this.apiUrl}/register`, user);
  }

  getAllUsers() {
    return this.http.get<any[]>(this.apiUrl);
  }

  logout() {
    localStorage.removeItem('token');
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  updateCurrency(userId: number, currency: string) {
    return this.http.put<any>(`${this.apiUrl}/${userId}/currency`, { currency });
  }

  changePassword(userId: number, data: any) {
    return this.http.put<any>(`${this.apiUrl}/${userId}/password`, data);
  }

  deleteUser(userId: number) {
    return this.http.delete<any>(`${this.apiUrl}/${userId}`);
  }

  toggleUserStatus(userId: number, currentStatus: boolean) {
    // Assuming the backend toggles status on this endpoint or expects the new status
    return this.http.put<any>(`${this.apiUrl}/${userId}/status`, { isActive: !currentStatus });
  }

  deleteAllUsers() {
    return this.http.delete<any>(this.apiUrl);
  }
}
