import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeKey = 'eduhub-theme';
  private currentTheme: string;

  constructor() {
    this.currentTheme = localStorage.getItem(this.themeKey) || 'dark';
    this.applyTheme(this.currentTheme);
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(this.themeKey, this.currentTheme);
    this.applyTheme(this.currentTheme);
  }

  private applyTheme(theme: string) {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
