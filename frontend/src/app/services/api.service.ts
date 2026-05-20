import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('eduhub-token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Usuarios
  getUsuarios(): Observable<any> {
    return this.http.get(`${this.apiUrl}/usuarios`, { headers: this.getHeaders() });
  }

  // Crear usuario usa /auth/registro (requiere admin token)
  createUsuario(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/registro`, data, { headers: this.getHeaders() });
  }

  updateUsuario(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${id}`, data, { headers: this.getHeaders() });
  }

  // El backend hace soft-delete (desactiva). Para borrado real usamos PATCH estado
  deleteUsuario(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/${id}`, { headers: this.getHeaders() });
  }

  deactivateUsuario(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/usuarios/${id}/estado`, { activo: false }, { headers: this.getHeaders() });
  }

  // Proyectos
  getProyectos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/proyectos`, { headers: this.getHeaders() });
  }

  createProyecto(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/proyectos`, data, { headers: this.getHeaders() });
  }

  updateProyecto(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/proyectos/${id}`, data, { headers: this.getHeaders() });
  }

  deleteProyecto(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/proyectos/${id}`, { headers: this.getHeaders() });
  }

  // Tareas
  getTareas(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get(`${this.apiUrl}/tareas`, { headers: this.getHeaders(), params: httpParams });
  }

  // Evaluaciones
  getEvaluaciones(): Observable<any> {
    return this.http.get(`${this.apiUrl}/evaluaciones`, { headers: this.getHeaders() });
  }

  // Noticias
  getNoticias(): Observable<any> {
    return this.http.get(`${this.apiUrl}/noticias`);
  }

  // Noticias usa multipart/form-data (multer en backend)
  createNoticia(data: any): Observable<any> {
    const formData = new FormData();
    formData.append('titulo', data.titulo || '');
    formData.append('contenido', data.contenido || '');
    formData.append('categoria', data.categoria || 'academico');
    const token = localStorage.getItem('eduhub-token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.post(`${this.apiUrl}/noticias`, formData, { headers });
  }

  deleteNoticia(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/noticias/${id}`, { headers: this.getHeaders() });
  }

  // Reportes
  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reportes/dashboard`, { headers: this.getHeaders() });
  }
}
