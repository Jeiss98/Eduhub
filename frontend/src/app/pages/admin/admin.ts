import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrls: ['../dashboard/dashboard.css', './admin.css']
})
export class Admin implements OnInit {
  usuario: any = null;
  stats: any = null;
  usuariosList: any[] = [];
  proyectosList: any[] = [];
  evaluacionesList: any[] = [];
  noticiasList: any[] = [];

  loading = true;
  activeSection: string = 'dashboard';

  // Modal State
  showUserModal = false;
  editingUser = false;
  userForm: any = {};

  showProyectoModal = false;
  editingProyecto = false;
  proyectoForm: any = {};

  showNoticiaModal = false;
  noticiaForm: any = {};

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private themeService: ThemeService
  ) { }

  setSection(section: string) {
    this.activeSection = section;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.usuario = this.authService.getUser();
    if (this.usuario.rol !== 'admin') {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadAdminData();
  }

  loadAdminData() {
    this.loading = true;
    this.apiService.getDashboardStats().subscribe({
      next: (res) => {
        if (res.ok) this.stats = res.data;
        this.loadUsuarios();
        this.loadProyectos();
        this.loadEvaluaciones();
        this.loadNoticias();
      },
      error: (err) => {
        console.error('Error loading admin stats', err);
        this.loading = false;
      }
    });
  }

  loadUsuarios() {
    this.apiService.getUsuarios().subscribe({
      next: (res) => {
        if (res.ok) this.usuariosList = res.data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading usuarios', err);
        this.loading = false;
      }
    });
  }

  loadProyectos() {
    this.apiService.getProyectos().subscribe({
      next: (res) => { if (res.ok) this.proyectosList = res.data; }
    });
  }

  loadEvaluaciones() {
    this.apiService.getEvaluaciones().subscribe({
      next: (res) => { if (res.ok) this.evaluacionesList = res.data; }
    });
  }

  loadNoticias() {
    this.apiService.getNoticias().subscribe({
      next: (res: any) => {
        this.noticiasList = res.data || res.noticias || [];
      }
    });
  }

  // ─── CRUD USUARIOS ───────────────────────────────────────────

  openCreateUser() {
    this.userForm = { rol: 'estudiante' };
    this.editingUser = false;
    this.showUserModal = true;
  }

  openEditUser(u: any) {
    this.userForm = { ...u };
    this.editingUser = true;
    this.showUserModal = true;
  }

  closeUserModal() {
    this.showUserModal = false;
    this.userForm = {};
  }

  saveUser() {
    // Usuarios vienen con _id directo de Mongoose (sin mapeo _enrich)
    const id = this.userForm._id;

    if (this.editingUser && id) {
      this.apiService.updateUsuario(id.toString(), this.userForm).subscribe({
        next: () => { this.loadUsuarios(); this.closeUserModal(); },
        error: (err) => {
          alert('Error: ' + (err.error?.mensaje || err.error?.message || 'Error al actualizar usuario'));
        }
      });
    } else {
      const payload = {
        nombre: this.userForm.nombre,
        apellido: this.userForm.apellido,
        email: this.userForm.email,
        documento: this.userForm.documento,
        rol: this.userForm.rol || 'estudiante'
      };
      this.apiService.createUsuario(payload).subscribe({
        next: () => {
          this.loadUsuarios();
          this.closeUserModal();
          alert('✅ Usuario creado. La contraseña inicial es su número de documento.');
        },
        error: (err) => {
          alert('Error: ' + (err.error?.mensaje || err.error?.message || 'Error al crear usuario'));
        }
      });
    }
  }

  deleteUser(id: any) {
    if (!id) { alert('ID de usuario inválido'); return; }
    if (confirm('¿Eliminar este usuario? Esta acción lo desactivará del sistema.')) {
      this.apiService.deleteUsuario(id.toString()).subscribe({
        next: () => { alert('Usuario desactivado correctamente.'); this.loadUsuarios(); },
        error: (err) => {
          alert('Error: ' + (err.error?.mensaje || err.error?.message || 'Error al eliminar usuario'));
        }
      });
    }
  }

  // ─── CRUD PROYECTOS ──────────────────────────────────────────

  openCreateProyecto() {
    const today = new Date().toISOString().split('T')[0];
    this.proyectoForm = {
      estado: 'activo',
      fecha_inicio: today,
      // El backend usa el id del usuario autenticado si no se manda id_docente,
      // pero lo mandamos explícito por si el admin crea en nombre propio
      id_docente: this.usuario?.id || this.usuario?._id
    };
    this.editingProyecto = false;
    this.showProyectoModal = true;
  }

  openEditProyecto(p: any) {
    this.proyectoForm = { ...p };
    this.editingProyecto = true;
    this.showProyectoModal = true;
  }

  closeProyectoModal() {
    this.showProyectoModal = false;
    this.proyectoForm = {};
  }

  saveProyecto() {
    // Proyectos pasan por _enrich → el campo id se llama "id", no "_id"
    const id = this.proyectoForm.id;

    if (!this.proyectoForm.titulo || !this.proyectoForm.fecha_limite) {
      alert('Título y Fecha Límite son obligatorios.');
      return;
    }
    if (!this.proyectoForm.fecha_inicio) {
      this.proyectoForm.fecha_inicio = new Date().toISOString().split('T')[0];
    }

    if (this.editingProyecto && id) {
      this.apiService.updateProyecto(id.toString(), this.proyectoForm).subscribe({
        next: () => { this.loadProyectos(); this.closeProyectoModal(); },
        error: (err) => {
          alert('Error: ' + (err.error?.mensaje || err.error?.message || 'Error al actualizar proyecto'));
        }
      });
    } else {
      this.apiService.createProyecto(this.proyectoForm).subscribe({
        next: () => { this.loadProyectos(); this.closeProyectoModal(); },
        error: (err) => {
          alert('Error: ' + (err.error?.mensaje || err.error?.message || 'Error al crear proyecto'));
        }
      });
    }
  }

  deleteProyecto(id: any) {
    // Proyectos pasan por _enrich → el campo es "id", no "_id"
    if (!id) { alert('ID de proyecto inválido'); return; }
    if (confirm('¿Eliminar este proyecto?')) {
      // Optimistic update
      this.proyectosList = this.proyectosList.filter((p: any) => p.id !== id);
      this.apiService.deleteProyecto(id.toString()).subscribe({
        next: () => this.loadProyectos(),
        error: () => { alert('Error al eliminar proyecto'); this.loadProyectos(); }
      });
    }
  }

  // ─── CRUD NOTICIAS ───────────────────────────────────────────

  openCreateNoticia() {
    this.noticiaForm = { categoria: 'academico' };
    this.showNoticiaModal = true;
  }

  closeNoticiaModal() {
    this.showNoticiaModal = false;
    this.noticiaForm = {};
  }

  saveNoticia() {
    if (!this.noticiaForm.titulo) { alert('El título es obligatorio.'); return; }
    this.apiService.createNoticia(this.noticiaForm).subscribe({
      next: () => { this.loadNoticias(); this.closeNoticiaModal(); },
      error: (err) => {
        alert('Error: ' + (err.error?.mensaje || err.error?.message || 'Error al publicar noticia'));
      }
    });
  }

  deleteNoticia(id: any) {
    if (!id) { alert('ID de noticia inválido'); return; }
    if (confirm('¿Eliminar esta noticia?')) {
      // Optimistic update
      this.noticiasList = this.noticiasList.filter((n: any) => (n._id || n.id) !== id);
      this.apiService.deleteNoticia(id.toString()).subscribe({
        next: () => { },
        error: () => { alert('Error al eliminar noticia'); this.loadNoticias(); }
      });
    }
  }

  // ─── AUTH ─────────────────────────────────────────────────────

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}