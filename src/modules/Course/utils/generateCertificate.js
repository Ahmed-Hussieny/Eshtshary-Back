import PDFDocument from 'pdfkit';
import fs from 'fs';

export async function HandleGenerateCertificate({ course, user, therapist, date }) {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  });

  const safeUsername = user.replace(/[^a-zA-Z0-9]/g, '_');
  const safeCourse = course.replace(/[^a-zA-Z0-9]/g, '_');
  const outputPath = `uploads/Certificates/Certificate_${safeCourse}_${safeUsername}.pdf`;
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // Border
  doc.save()
    .rect(30, 30, pageWidth - 60, pageHeight - 60)
    .fill('#fff9f0')
    .stroke('#2a5885', 3)
    .restore();

  // Corners
  const corner = (x, y, dx1, dy1, dx2, dy2) => {
    doc.moveTo(x, y)
      .lineTo(x + dx1, y + dy1)
      .lineTo(x + dx2, y + dy2)
      .stroke('#2a5885', 2);
  };

  corner(30, 30, 0, 30, 30, 0);
  corner(pageWidth - 30, 30, -30, 0, 0, 30);
  corner(30, pageHeight - 30, 0, -30, 30, 0);
  corner(pageWidth - 30, pageHeight - 30, -30, 0, 0, -30);

  // Title
  doc.fillColor('#2a5885')
    .font('Helvetica-Bold')
    .fontSize(42)
    .text('CERTIFICATE OF ACHIEVEMENT', 0, 80, { align: 'center' });

//   // Decorative seal
//   const sealY = 150;
//   doc.circle(pageWidth / 2, sealY, 40)
//     .fill('#f0f0f0')
//     .stroke('#2a5885', 2);
//   doc.fillColor('#2a5885')
//     .fontSize(12)
//     .text('OFFICIAL', pageWidth / 2 - 25, sealY - 10, { width: 50, align: 'center' })
//     .text('SEAL', pageWidth / 2 - 15, sealY + 5, { width: 30, align: 'center' });

  // Main Content
  const mainY = 220;
  doc.fillColor('#333')
    .font('Helvetica')
    .fontSize(24)
    .text('This is to certify that', 0, mainY, { align: 'center' });

  doc.fillColor('#2a5885')
    .font('Helvetica-Bold')
    .fontSize(38)
    .text(user.toUpperCase(), 0, mainY + 40, { align: 'center' });

  doc.fillColor('#333')
    .font('Helvetica')
    .fontSize(24)
    .text('has successfully completed the course', 0, mainY + 90, { align: 'center' });

  doc.fillColor('#2a5885')
    .font('Helvetica-Bold')
    .fontSize(30)
    .text(`"${course}"`, 0, mainY + 130, { align: 'center' });

  doc.fillColor('#555')
    .font('Helvetica-Oblique')
    .fontSize(18)
    .text(`Completed on ${formattedDate}`, 0, mainY + 180, { align: 'center' });

  // Signature
  const sigY = mainY + 230;
  doc.fillColor('#333')
    .font('Helvetica')
    .fontSize(16)
    .text('Certified by:', pageWidth / 2 - 200, sigY);

  doc.fillColor('#2a5885')
    .font('Helvetica-Bold')
    .fontSize(18)
    .text(" ARAB ADHD", pageWidth / 2 - 200, sigY + 20);

  // Signature line
  doc.moveTo(pageWidth / 2 + 50, sigY + 30)
    .lineTo(pageWidth / 2 + 250, sigY + 30)
    .stroke('#333', 1);


  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      resolve(outputPath);
    });
    stream.on('error', reject);
  });
}
