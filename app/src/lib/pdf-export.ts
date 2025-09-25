import type { BriefContext } from './schema';

interface PDFExportData {
  title: string;
  content: string;
  venue: string;
  decisionMaker: string;
  context: BriefContext;
}

interface PDFGenerationError extends Error {
  status?: number;
}

/**
 * Export the current brief as a PDF
 */
export async function exportToPDF(data: PDFExportData): Promise<void> {
  try {
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: data.title || 'Investment Brief',
        content: data.content || '',
        venue: data.venue || 'Investment Committee',
        decisionMaker: data.decisionMaker || 'Board of Trustees',
        context: data.context,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      const error = new Error(`PDF generation failed: ${errorText}`) as PDFGenerationError;
      error.status = response.status;
      throw error;
    }

    // Handle PDF download
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizeFilename(data.title || 'investment-brief')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('PDF export failed:', error);

    if (error instanceof Error && 'status' in error) {
      const pdfError = error as PDFGenerationError;
      switch (pdfError.status) {
        case 403:
          throw new Error('PDF generation not available from this domain');
        case 413:
          throw new Error('Content too large for PDF generation (max 50KB)');
        case 429:
          throw new Error('Too many PDF requests. Please wait before trying again.');
        case 503:
          throw new Error('PDF generation service temporarily unavailable');
        default:
          throw new Error(`PDF generation failed (${pdfError.status})`);
      }
    }

    throw new Error('PDF generation failed. Please try again.');
  }
}

/**
 * Sanitize filename for download
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9\s-]/gi, '')
    .replace(/\s+/g, '_')
    .toLowerCase()
    .substring(0, 50);
}

/**
 * Get formatted content from the current preview
 */
export function getPreviewContent(): string {
  const previewElement = document.querySelector('[data-preview-content]');
  if (!previewElement) {
    throw new Error('No content available to export');
  }

  // Convert HTML to markdown-like format
  let content = '';

  // Extract sections
  const sections = previewElement.querySelectorAll('section');
  sections.forEach(section => {
    const heading = section.querySelector('h2');
    if (heading) {
      content += `# ${heading.textContent?.trim()}\n\n`;
    }

    // Extract content based on section type
    const paragraphs = section.querySelectorAll('p');
    paragraphs.forEach(p => {
      if (p.textContent?.trim()) {
        content += `${p.textContent.trim()}\n\n`;
      }
    });

    // Extract lists
    const lists = section.querySelectorAll('ul, ol');
    lists.forEach(list => {
      const items = list.querySelectorAll('li');
      items.forEach(item => {
        if (item.textContent?.trim()) {
          content += `- ${item.textContent.trim()}\n`;
        }
      });
      if (items.length > 0) content += '\n';
    });

    // Extract tables (for counters section)
    const tables = section.querySelectorAll('table');
    tables.forEach(table => {
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          const claim = cells[0].textContent?.trim() || '';
          const response = cells[1].textContent?.trim() || '';
          content += `**${claim}**\n\n${response}\n\n`;
        }
      });
    });
  });

  if (!content.trim()) {
    throw new Error('No content found to export');
  }

  return content.trim();
}

/**
 * Generate a title based on the current context
 */
export function generateTitle(context: BriefContext): string {
  const parts = [];

  if (context.identity) {
    parts.push(context.identity.charAt(0).toUpperCase() + context.identity.slice(1));
  }

  if (context.venue) {
    parts.push(context.venue.replace('_', ' '));
  }

  parts.push('Investment Brief');

  return parts.join(' - ');
}