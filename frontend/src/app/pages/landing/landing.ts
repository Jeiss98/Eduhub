import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing implements OnInit {
  noticias: any[] = [];
  noticiaSeleccionada: any = null;

  constructor(
    private themeService: ThemeService,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.apiService.getNoticias().subscribe({
      next: (res: any) => {
        const lista = res.data || res.noticias || [];
        this.noticias = [...lista.slice(0, 6)];
        this.cdr.detectChanges();

        setTimeout(() => {
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(e => {
              if (e.isIntersecting) e.target.classList.add('visible');
            });
          }, { threshold: 0.1 });
          document.querySelectorAll('.news-card, .feat-card').forEach(el => observer.observe(el));
        }, 100);
      },
      error: (err) => console.error('❌ Error:', err)
    });
  }

  abrirNoticia(noticia: any) {
    this.noticiaSeleccionada = noticia;
    document.body.style.overflow = 'hidden';
  }

  cerrarNoticia() {
    this.noticiaSeleccionada = null;
    document.body.style.overflow = '';
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}