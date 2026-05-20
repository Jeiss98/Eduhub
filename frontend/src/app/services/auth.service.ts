import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((res: any) => {
        if (res.ok && res.token) {
          localStorage.setItem('eduhub-token', res.token);
          localStorage.setItem('eduhub-user', JSON.stringify(res.usuario));
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('eduhub-token');
    localStorage.removeItem('eduhub-user');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('eduhub-token');
  }

  getUser() {
    const user = localStorage.getItem('eduhub-user');
    return user ? JSON.parse(user) : null;
  }
}
