const fs = require('fs');
let html = fs.readFileSync('src/app/pages/admin/admin.html', 'utf8');

// 1. Proyectos wiring
html = html.replace(
  '<button class=\"btn btn-primary btn-sm\" id=\"btn-nuevo-proyecto\">+ Crear Proyecto</button>',
  '<button class=\"btn btn-primary btn-sm\" id=\"btn-nuevo-proyecto\" (click)=\"openCreateProyecto()\">+ Crear Proyecto</button>'
);

// Add editing to projects table
html = html.replace(
  '<button class=\"btn btn-ghost btn-sm\">Editar</button>',
  '<button class=\"btn btn-ghost btn-sm\" (click)=\"openEditProyecto(p)\">Editar</button>'
);

// Add delete to projects table
html = html.replace(
    '\(click\)="openEditProyecto\(p\)">Editar<\/button>',
    '(click)="openEditProyecto(p)">Editar</button><button class="btn btn-danger btn-sm" (click)="deleteProyecto(p._id || p.id_proyecto)" style="margin-left:5px;">Borrar</button>'
);


// 2. Add Noticias wiring
html = html.replace(
    '<button class="btn btn-primary btn-sm" id="btn-nueva-noticia" onclick="abrirModal(\'modal-noticia\')">+ Publicar Noticia</button>',
    '<button class="btn btn-primary btn-sm" id="btn-nueva-noticia" (click)="openCreateNoticia()">+ Publicar Noticia</button>'
);

// Add dynamic list to noticias
const newsListHtml = `
            <div class="card-body" id="noticias-list">
              <div *ngIf="noticiasList.length === 0" style="text-align:center; padding:20px; color:var(--muted);">No hay noticias.</div>
              <div class="news-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:20px;">
                <div class="card" *ngFor="let n of noticiasList">
                  <div class="card-head" style="justify-content:space-between;">
                    <span class="card-title">{{ n.titulo }}</span>
                    <button class="btn btn-danger btn-xs" (click)="deleteNoticia(n._id || n.id)">🗑</button>
                  </div>
                  <div class="card-body">
                    <p style="font-size:14px; color:var(--text-muted);">{{ n.contenido }}</p>
                    <div style="font-size:12px; margin-top:10px; color:var(--primary);">{{ n.categoria | titlecase }}</div>
                  </div>
                </div>
              </div>
            </div>
`;
html = html.replace(/<div class="card-body" id="noticias-list">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, newsListHtml + '</div></div>');

// 3. Add Modals for Proyecto and Noticia
const proyectoModalHtml = `
  <!-- Modal Proyecto -->
  <div class="modal-overlay" [class.hidden]="!showProyectoModal" (click)="closeProyectoModal()">
    <div class="modal-box" (click)="$event.stopPropagation()">
      <div class="modal-header" style="display:flex; justify-content:space-between; padding:20px; border-bottom:1px solid var(--border);">
        <span class="modal-title" style="font-weight:700;">{{ editingProyecto ? 'Editar' : 'Crear' }} Proyecto</span>
        <button class="close-modal" style="background:none; border:none; cursor:pointer;" (click)="closeProyectoModal()">✕</button>
      </div>
      <div class="modal-body" style="padding: 20px; display:flex; flex-direction:column; gap:15px;">
         <div><label style="font-size:12px;">Título</label><input type="text" [(ngModel)]="proyectoForm.titulo" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--surface); color:var(--text);" /></div>
         <div><label style="font-size:12px;">Descripción</label><textarea [(ngModel)]="proyectoForm.descripcion" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--surface); color:var(--text);"></textarea></div>
         <div style="display:flex; gap:10px;">
           <div style="flex:1;"><label style="font-size:12px;">Fecha Límite</label><input type="date" [(ngModel)]="proyectoForm.fecha_limite" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--surface); color:var(--text);" /></div>
           <div style="flex:1;"><label style="font-size:12px;">Estado</label>
             <select [(ngModel)]="proyectoForm.estado" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--surface); color:var(--text);">
                <option value="activo">Activo</option>
                <option value="pausado">Pausado</option>
                <option value="finalizado">Finalizado</option>
             </select>
           </div>
         </div>
         <div style="text-align:right; margin-top:10px;">
           <button class="btn btn-ghost btn-sm" (click)="closeProyectoModal()">Cancelar</button>
           <button class="btn btn-primary btn-sm" (click)="saveProyecto()">Guardar</button>
         </div>
      </div>
    </div>
  </div>
`;

const noticiaModalHtml = `
  <!-- Modal Noticia -->
  <div class="modal-overlay" [class.hidden]="!showNoticiaModal" (click)="closeNoticiaModal()">
    <div class="modal-box" (click)="$event.stopPropagation()">
      <div class="modal-header" style="display:flex; justify-content:space-between; padding:20px; border-bottom:1px solid var(--border);">
        <span class="modal-title" style="font-weight:700;">Publicar Noticia</span>
        <button class="close-modal" style="background:none; border:none; cursor:pointer;" (click)="closeNoticiaModal()">✕</button>
      </div>
      <div class="modal-body" style="padding: 20px; display:flex; flex-direction:column; gap:15px;">
         <div><label style="font-size:12px;">Título</label><input type="text" [(ngModel)]="noticiaForm.titulo" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--surface); color:var(--text);" /></div>
         <div><label style="font-size:12px;">Contenido</label><textarea [(ngModel)]="noticiaForm.contenido" rows="4" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--surface); color:var(--text);"></textarea></div>
         <div><label style="font-size:12px;">Categoría</label>
           <select [(ngModel)]="noticiaForm.categoria" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--surface); color:var(--text);">
              <option value="academico">Académico</option>
              <option value="taller">Taller</option>
              <option value="infra">Infraestructura</option>
              <option value="logro">Logro</option>
           </select>
         </div>
         <div style="text-align:right; margin-top:10px;">
           <button class="btn btn-ghost btn-sm" (click)="closeNoticiaModal()">Cancelar</button>
           <button class="btn btn-primary btn-sm" (click)="saveNoticia()">Publicar</button>
         </div>
      </div>
    </div>
  </div>
`;

// Replace existing Modal Noticia
html = html.replace(/<!-- Modal Noticia -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, noticiaModalHtml);
// Insert Proyecto Modal before Noticia Modal
html = html.replace('<!-- Modal Noticia -->', proyectoModalHtml + '\n  <!-- Modal Noticia -->');

fs.writeFileSync('src/app/pages/admin/admin.html', html);
