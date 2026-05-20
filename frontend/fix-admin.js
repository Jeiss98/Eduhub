const fs = require('fs');
let html = fs.readFileSync('src/app/pages/admin/admin.html', 'utf8');

// 1. Add click to Crear Usuario
html = html.replace(
  '<button class=\"btn btn-primary btn-sm\" id=\"btn-nuevo-usuario\">+ Crear Usuario</button>',
  '<button class=\"btn btn-primary btn-sm\" id=\"btn-nuevo-usuario\" (click)=\"openCreateUser()\">+ Crear Usuario</button>'
);

// 2. Wire up the User buttons
html = html.replace(
  /<button class="btn btn-ghost btn-sm">Editar<\/button>/g,
  '<button class="btn btn-ghost btn-sm" (click)="openEditUser(u)">Editar</button>'
);

html = html.replace(
  /<td style="padding:12px; border-bottom:1px solid var\(--border\);">\s*<button class="btn btn-ghost btn-sm" \(click\)="openEditUser\(u\)">Editar<\/button>\s*<\/td>/g,
  `<td style="padding:12px; border-bottom:1px solid var(--border); display:flex; gap:6px;">
    <button class="btn btn-ghost btn-sm" (click)="openEditUser(u)">Editar</button>
    <button class="btn btn-danger btn-sm" (click)="deleteUser(u._id || u.id_usuario)">Eliminar</button>
  </td>`
);

// 3. Proyectos list
const proyBody = `
              <tbody id="proyectos-body">
                <tr *ngIf="proyectosList.length === 0">
                  <td colspan="5" style="padding:20px; text-align:center; color:var(--muted);">No hay proyectos.</td>
                </tr>
                <tr *ngFor="let p of proyectosList">
                  <td style="padding:12px; border-bottom:1px solid var(--border);">{{ p.titulo || p.nombre }}</td>
                  <td style="padding:12px; border-bottom:1px solid var(--border);">{{ p.lider_nombre || p.creador || '—' }}</td>
                  <td style="padding:12px; border-bottom:1px solid var(--border);">{{ p.estado }}</td>
                  <td style="padding:12px; border-bottom:1px solid var(--border);">{{ p.avance || 0 }}%</td>
                  <td style="padding:12px; border-bottom:1px solid var(--border);">
                    <button class="btn btn-ghost btn-sm">Editar</button>
                  </td>
                </tr>
              </tbody>
`;
html = html.replace(/<tbody id="proyectos-body">[\s\S]*?<\/tbody>/, proyBody);

// 4. Modal User
const modalHtml = `
  <!-- Modal Usuario -->
  <div class="modal-overlay" [class.hidden]="!showUserModal" (click)="closeUserModal()">
    <div class="modal-box" (click)="$event.stopPropagation()">
      <div class="modal-header" style="display:flex; justify-content:space-between; padding:20px; border-bottom:1px solid var(--border);">
        <span class="modal-title" style="font-weight:700;">{{ editingUser ? 'Editar' : 'Crear' }} Usuario</span>
        <button class="close-modal" style="background:none; border:none; cursor:pointer;" (click)="closeUserModal()">✕</button>
      </div>
      <div class="modal-body" style="padding: 20px; display:flex; flex-direction:column; gap:15px;">
         <div style="display:flex; gap:10px;">
           <div style="flex:1;"><label style="font-size:12px;">Nombre</label><input type="text" [(ngModel)]="userForm.nombre" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--surface); color:var(--text);" /></div>
           <div style="flex:1;"><label style="font-size:12px;">Apellido</label><input type="text" [(ngModel)]="userForm.apellido" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--surface); color:var(--text);" /></div>
         </div>
         <div><label style="font-size:12px;">Email</label><input type="email" [(ngModel)]="userForm.email" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--surface); color:var(--text);" /></div>
         <div style="display:flex; gap:10px;">
           <div style="flex:1;"><label style="font-size:12px;">Documento</label><input type="text" [(ngModel)]="userForm.documento" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--surface); color:var(--text);" /></div>
           <div style="flex:1;"><label style="font-size:12px;">Rol</label>
             <select [(ngModel)]="userForm.rol" style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--surface); color:var(--text);">
                <option value="estudiante">Estudiante</option>
                <option value="docente">Docente</option>
                <option value="admin">Administrador</option>
             </select>
           </div>
         </div>
         <div style="text-align:right; margin-top:10px;">
           <button class="btn btn-ghost btn-sm" (click)="closeUserModal()">Cancelar</button>
           <button class="btn btn-primary btn-sm" (click)="saveUser()">Guardar</button>
         </div>
      </div>
    </div>
  </div>
`;

html = html.replace('<!-- Modal -->', modalHtml + '\n  <!-- Modal Noticia -->');

fs.writeFileSync('src/app/pages/admin/admin.html', html);
