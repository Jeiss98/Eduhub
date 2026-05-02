// utils/pdfGenerator.js
const PDFDocument = require('pdfkit');

function generarPDF(res, titulo, filas, columnas) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${titulo.replace(/\s+/g, '_')}.pdf"`);
  doc.pipe(res);

  // Header
  doc.fontSize(20).fillColor('#004F39').font('Helvetica-Bold').text('EduHub', 50, 50);
  doc.fontSize(10).fillColor('#5C6050').font('Helvetica').text('Fundación Universitaria Konrad Lorenz', 50, 74);
  doc.fontSize(14).fillColor('#151613').font('Helvetica-Bold').text(titulo, 50, 100);
  doc.fontSize(9).fillColor('#8A9070').font('Helvetica')
     .text(`Generado: ${new Date().toLocaleString('es-CO')}`, 50, 118);
  doc.moveTo(50, 136).lineTo(545, 136).strokeColor('#004F39').lineWidth(2).stroke();

  if (filas.length === 0) {
    doc.fontSize(11).fillColor('#5C6050').text('Sin datos disponibles.', 50, 156);
    doc.end(); return;
  }

  const colW = Math.floor(490 / columnas.length);
  let y = 156;

  // Cabecera tabla
  doc.fillColor('#004F39').rect(50, y, 495, 22).fill();
  columnas.forEach((col, i) => {
    doc.fontSize(9).fillColor('white').font('Helvetica-Bold')
       .text(col.label, 55 + i * colW, y + 6, { width: colW - 5 });
  });
  y += 22;

  // Filas
  filas.forEach((fila, idx) => {
    if (y > 750) { doc.addPage(); y = 50; }
    doc.fillColor(idx % 2 === 0 ? '#F5F5F2' : '#FFFFFF').rect(50, y, 495, 20).fill();
    columnas.forEach((col, i) => {
      const val = fila[col.key] != null ? String(fila[col.key]) : '—';
      doc.fontSize(8).fillColor('#2C2E28').font('Helvetica')
         .text(val.substring(0, 28), 55 + i * colW, y + 6, { width: colW - 5 });
    });
    y += 20;
  });

  doc.fontSize(8).fillColor('#8A9070')
     .text(`Total: ${filas.length} registros`, 50, y + 12);
  doc.end();
}

module.exports = { generarPDF };
