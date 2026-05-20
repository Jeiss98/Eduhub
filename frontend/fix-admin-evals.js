const fs = require('fs');
let html = fs.readFileSync('src/app/pages/admin/admin.html', 'utf8');

const evalBody = `
              <tbody id="evaluaciones-body">
                <tr *ngIf="evaluacionesList.length === 0">
                  <td colspan="5" style="padding:20px; text-align:center; color:var(--muted);">No hay evaluaciones registradas.</td>
                </tr>
                <tr *ngFor="let e of evaluacionesList">
                  <td style="padding:12px; border-bottom:1px solid var(--border);">{{ e.estudiante_nombre || '—' }}</td>
                  <td style="padding:12px; border-bottom:1px solid var(--border);">{{ e.proyecto_nombre || '—' }}</td>
                  <td style="padding:12px; border-bottom:1px solid var(--border);">
                    <span [style.color]="e.calificacion >= 3 ? 'green' : 'red'">{{ e.calificacion || '—' }}</span>
                  </td>
                  <td style="padding:12px; border-bottom:1px solid var(--border);">{{ e.docente_nombre || '—' }}</td>
                  <td style="padding:12px; border-bottom:1px solid var(--border);">
                    <button class="btn btn-ghost btn-xs">Ver</button>
                  </td>
                </tr>
              </tbody>
`;

html = html.replace(/<tbody id="evaluaciones-body">[\s\S]*?<\/tbody>/, evalBody);

fs.writeFileSync('src/app/pages/admin/admin.html', html);
