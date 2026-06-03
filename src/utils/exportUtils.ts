import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Habilis corporate colors for styling PDF
const COLOR_BLUE = [0, 96, 159]; // RGB for #00609F
const COLOR_RED = [255, 77, 61];  // RGB for #FF4D3D

export const exportUtils = {
  /**
   * Exports data to Excel (.xlsx) format
   */
  exportToExcel: (data: any[], fileName: string, sheetName: string = 'Datos') => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // Auto-size columns to be readable
      const maxLens = data.reduce((acc, row) => {
        Object.keys(row).forEach((key, idx) => {
          const valStr = String(row[key] || '');
          acc[idx] = Math.max(acc[idx] || 0, valStr.length, key.length);
        });
        return acc;
      }, [] as number[]);
      
      worksheet['!cols'] = maxLens.map((len: number) => ({ wch: len + 3 }));

      XLSX.writeFile(workbook, `${fileName}.xlsx`);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      alert('Hubo un error al generar el archivo Excel.');
    }
  },

  /**
   * Exports data to CSV format
   */
  exportToCSV: (data: any[], fileName: string) => {
    try {
      if (data.length === 0) return;
      
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(','), // Header row
        ...data.map(row => 
          headers
            .map(fieldName => {
              const value = row[fieldName];
              const stringValue = value === null || value === undefined ? '' : String(value);
              // Escape double quotes and wrap in quotes if contains commas or newlines
              const escaped = stringValue.replace(/"/g, '""');
              return escaped.includes(',') || escaped.includes('\n') || escaped.includes('"') 
                ? `"${escaped}"` 
                : escaped;
            })
            .join(',')
        )
      ];

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${fileName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al exportar a CSV:', error);
      alert('Hubo un error al generar el archivo CSV.');
    }
  },

  /**
   * Exports data to PDF with beautiful Habilis header and styled table
   */
  exportToPDF: (
    title: string,
    headers: string[],
    rows: any[][],
    fileName: string
  ) => {
    try {
      const doc = new jsPDF();
      const dateStr = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Habilis Header styling
      // Blue top bar
      doc.setFillColor(COLOR_BLUE[0], COLOR_BLUE[1], COLOR_BLUE[2]);
      doc.rect(0, 0, 210, 8, 'F');

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(COLOR_BLUE[0], COLOR_BLUE[1], COLOR_BLUE[2]);
      doc.text('HABILIS LOGÍSTICA', 14, 25);
      
      // Secondary Red accent mark
      doc.setDrawColor(COLOR_RED[0], COLOR_RED[1], COLOR_RED[2]);
      doc.setLineWidth(1.5);
      doc.line(14, 28, 60, 28);

      // Document Title
      doc.setFontSize(14);
      doc.setTextColor(60, 60, 60);
      doc.text(title.toUpperCase(), 14, 38);

      // Metadata
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(`Fecha de exportación: ${dateStr}`, 14, 45);
      doc.text('Generado automáticamente desde Plataforma Integral Habilis', 14, 50);

      // Table formatting using autoTable
      (doc as any).autoTable({
        startY: 55,
        head: [headers],
        body: rows,
        headStyles: {
          fillColor: COLOR_BLUE,
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 248, 250]
        },
        margin: { left: 14, right: 14 },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        theme: 'striped'
      });

      // Footer
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Página ${i} de ${totalPages}`,
          14,
          285
        );
        doc.text(
          'Confidencial - Uso Interno Habilis Logística',
          140,
          285
        );
      }

      doc.save(`${fileName}.pdf`);
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      alert('Hubo un error al generar el archivo PDF.');
    }
  }
};
