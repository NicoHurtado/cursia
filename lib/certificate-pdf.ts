import jsPDF from 'jspdf';

interface CertificateData {
  userName: string;
  courseName: string;
  completionDate: string;
  certificateId: string;
}

export function generateCertificatePDF(certificateData: CertificateData): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background gradient effect (simplified)
  doc.setFillColor(240, 248, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Decorative border elements
  const borderColor = [59, 130, 246]; // Blue-500

  // Top-left triangle
  doc.setFillColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.triangle(0, 0, 60, 0, 0, 60, 'F');

  // Top-right triangle
  doc.setFillColor(
    borderColor[0] - 20,
    borderColor[1] - 20,
    borderColor[2] - 20
  );
  doc.triangle(pageWidth, 0, pageWidth - 60, 0, pageWidth, 60, 'F');

  // Bottom-left triangle
  doc.setFillColor(
    borderColor[0] - 10,
    borderColor[1] - 10,
    borderColor[2] - 10
  );
  doc.triangle(0, pageHeight, 60, pageHeight, 0, pageHeight - 60, 'F');

  // Bottom-right triangle
  doc.setFillColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.triangle(
    pageWidth,
    pageHeight,
    pageWidth - 60,
    pageHeight,
    pageWidth,
    pageHeight - 60,
    'F'
  );

  // Decorative circles
  doc.setFillColor(
    borderColor[0] - 30,
    borderColor[1] - 30,
    borderColor[2] - 30
  );
  doc.circle(pageWidth - 30, 30, 8, 'F');
  doc.circle(30, pageHeight - 30, 6, 'F');
  doc.circle(15, pageHeight / 2, 4, 'F');
  doc.circle(pageWidth - 15, pageHeight / 3, 5, 'F');

  // Main content
  const centerX = pageWidth / 2;
  const startY = 80;

  // Certificate title
  doc.setFontSize(36);
  doc.setTextColor(37, 99, 235); // Blue-600
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICADO', centerX, startY, { align: 'center' });

  // Subtitle
  doc.setFontSize(16);
  doc.setTextColor(59, 130, 246); // Blue-500
  doc.setFont('helvetica', 'normal');
  doc.text('DE COMPLETACIÓN DE CURSO', centerX, startY + 15, {
    align: 'center',
  });

  // Presentation text
  doc.setFontSize(14);
  doc.setTextColor(75, 85, 99); // Gray-600
  doc.text('Se otorga el presente certificado a:', centerX, startY + 45, {
    align: 'center',
  });

  // Student name
  doc.setFontSize(32);
  doc.setTextColor(30, 64, 175); // Blue-800
  doc.setFont('helvetica', 'bold');
  doc.text(certificateData.userName.toUpperCase(), centerX, startY + 75, {
    align: 'center',
  });

  // Completion message
  doc.setFontSize(16);
  doc.setTextColor(55, 65, 81); // Gray-700
  doc.setFont('helvetica', 'normal');

  const message = `Por haber completado exitosamente el curso de ${certificateData.courseName}`;
  const messageLines = doc.splitTextToSize(message, pageWidth - 40);
  doc.text(messageLines, centerX, startY + 105, { align: 'center' });

  // Completion date
  const completionDate = new Date(
    certificateData.completionDate
  ).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  doc.setFontSize(14);
  doc.setTextColor(75, 85, 99); // Gray-600
  doc.text(`Completado el ${completionDate}`, centerX, startY + 130, {
    align: 'center',
  });

  // Certificate ID section
  doc.setDrawColor(59, 130, 246); // Blue-500
  doc.setLineWidth(0.5);
  doc.line(centerX - 80, startY + 160, centerX + 80, startY + 160);
  doc.line(centerX - 80, startY + 175, centerX + 80, startY + 175);

  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128); // Gray-500
  doc.text(
    `ID de Certificado: ${certificateData.certificateId}`,
    centerX,
    startY + 168,
    { align: 'center' }
  );

  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175); // Gray-400
  doc.text(
    'Este certificado puede ser verificado online',
    centerX,
    startY + 172,
    { align: 'center' }
  );

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175); // Gray-400
  doc.text(
    'Emitido por Cursia - Plataforma de Aprendizaje Online',
    centerX,
    pageHeight - 10,
    { align: 'center' }
  );

  // Generate filename
  const fileName = `certificado-${certificateData.userName.toLowerCase().replace(/\s+/g, '-')}-${certificateData.courseName.toLowerCase().replace(/\s+/g, '-')}.pdf`;

  // Save the PDF
  doc.save(fileName);
}

export function downloadCertificatePDF(certificateData: CertificateData): void {
  try {
    generateCertificatePDF(certificateData);
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fallback: open in new window
    alert('Error generando el PDF. Por favor, inténtalo de nuevo.');
  }
}
