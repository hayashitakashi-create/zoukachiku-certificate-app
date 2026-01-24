import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type WorkItem = {
  id: string;
  workType: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
};

type Certificate = {
  id: string;
  applicantName: string;
  applicantAddress: string;
  propertyNumber: string | null;
  propertyAddress: string;
  completionDate: string;
  purposeType: string;
  subsidyAmount: number;
  issuerName: string | null;
  issuerOfficeName: string | null;
  issuerOrganizationType: string | null;
  issuerQualificationNumber: string | null;
  issueDate: string | null;
  status: string;
  works?: {
    seismic: WorkItem[];
    barrierFree: WorkItem[];
    energySaving: WorkItem[];
    cohabitation: WorkItem[];
    childcare: WorkItem[];
    otherRenovation: WorkItem[];
    longTermHousing: WorkItem[];
  };
};

const getPurposeTypeLabel = (purposeType: string) => {
  const labels: Record<string, string> = {
    housing_loan: 'Jutaku Kariirekin-to Tokubetsu Kojo',
    reform_tax: 'Tokutei Zokaichiku-to Jutaku Kariirekin-to Tokubetsu Kojo',
    resale: 'Kison Jutaku ni Kakaru Tokutei no Kaishu Koji wo Shita Baai no Shotokuzei-gaku no Tokubetsu Kojo',
    property_tax: 'Kotei Shisan-zei no Gengaku',
  };
  return labels[purposeType] || purposeType;
};

const getWorkTypeLabel = (key: string) => {
  const labels: Record<string, string> = {
    seismic: 'Taishin Kaishu Koji',
    barrierFree: 'Barrier-free Kaishu Koji',
    energySaving: 'Shoen Kaishu Koji',
    cohabitation: 'Dokyo Taio Kaishu Koji',
    childcare: 'Kosodate Taio Kaishu Koji',
    otherRenovation: 'Sonota Zokaichiku-to Koji',
    longTermHousing: 'Choki Yuryo Jutaku-ka Kaishu Koji',
  };
  return labels[key] || key;
};

export const generateCertificatePDF = (certificate: Certificate) => {
  // Create new PDF document (A4 size)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let yPosition = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Zokaichiku-to Koji Shomeisho', 105, yPosition, { align: 'center' });
  doc.setFontSize(14);
  yPosition += 8;
  doc.text('(Certificate of Renovation Work)', 105, yPosition, { align: 'center' });

  yPosition += 15;

  // Certificate ID
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Certificate ID: ${certificate.id}`, 20, yPosition);
  yPosition += 7;

  // Status and Issue Date
  doc.text(`Status: ${certificate.status.toUpperCase()}`, 20, yPosition);
  if (certificate.issueDate) {
    const issueDate = new Date(certificate.issueDate).toLocaleDateString('ja-JP');
    doc.text(`Issue Date: ${issueDate}`, 120, yPosition);
  }
  yPosition += 10;

  // Basic Information Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Basic Information', 20, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const basicInfo = [
    ['Applicant Name', certificate.applicantName],
    ['Applicant Address', certificate.applicantAddress],
    ['Property Number', certificate.propertyNumber || '-'],
    ['Property Address', certificate.propertyAddress],
    ['Completion Date', new Date(certificate.completionDate).toLocaleDateString('ja-JP')],
    ['Purpose Type', getPurposeTypeLabel(certificate.purposeType)],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: basicInfo,
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 130 },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Issuer Information Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Issuer Information', 20, yPosition);
  yPosition += 7;

  const issuerInfo = [
    ['Issuer Name', certificate.issuerName || '-'],
    ['Office Name', certificate.issuerOfficeName || '-'],
    ['Organization Type', certificate.issuerOrganizationType || '-'],
    ['Qualification Number', certificate.issuerQualificationNumber || '-'],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: issuerInfo,
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 130 },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Work Details Section
  if (certificate.works) {
    let grandTotal = 0;

    Object.entries(certificate.works).forEach(([key, workItems]) => {
      if (!workItems || workItems.length === 0) return;

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(getWorkTypeLabel(key), 20, yPosition);
      yPosition += 5;

      const tableData = workItems.map((work) => [
        work.workType,
        work.quantity.toLocaleString(),
        `¥${work.unitPrice.toLocaleString()}`,
        `¥${work.totalAmount.toLocaleString()}`,
      ]);

      const workTotal = workItems.reduce((sum, work) => sum + work.totalAmount, 0);
      grandTotal += workTotal;

      tableData.push([
        { content: 'Subtotal', colSpan: 3, styles: { fontStyle: 'bold', halign: 'right' } },
        { content: `¥${workTotal.toLocaleString()}`, styles: { fontStyle: 'bold' } },
      ] as any);

      autoTable(doc, {
        startY: yPosition,
        head: [['Work Type', 'Quantity', 'Unit Price', 'Amount']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontSize: 9,
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 30, halign: 'right' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 35, halign: 'right' },
        },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 8;
    });

    // Amount Summary
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Amount Summary', 20, yPosition);
    yPosition += 7;

    const deductibleAmount = Math.max(0, grandTotal - certificate.subsidyAmount);

    const summaryData = [
      ['Total Work Cost', `¥${grandTotal.toLocaleString()}`],
      ['Subsidy Amount', `¥${certificate.subsidyAmount.toLocaleString()}`],
      ['Deductible Amount', `¥${deductibleAmount.toLocaleString()}`],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: summaryData,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80, halign: 'right' },
        1: { cellWidth: 60, halign: 'right', fontSize: 11, fontStyle: 'bold' },
      },
    });
  }

  // Footer
  const pageCount = (doc as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${i} of ${pageCount}`,
      105,
      287,
      { align: 'center' }
    );
    doc.text(
      `Generated: ${new Date().toLocaleDateString('ja-JP')} ${new Date().toLocaleTimeString('ja-JP')}`,
      105,
      292,
      { align: 'center' }
    );
  }

  // Generate filename
  const filename = `certificate_${certificate.id}_${new Date().toISOString().slice(0, 10)}.pdf`;

  // Save the PDF
  doc.save(filename);
};
