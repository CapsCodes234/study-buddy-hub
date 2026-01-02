/**
 * PDF Text Extraction Utility
 * Uses pdfjs-dist to extract text content from PDF files
 */

// Lazy load pdfjs-dist to reduce initial bundle size
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function loadPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    // Set up the worker for pdfjs - use CDN for worker
    if (typeof window !== 'undefined' && pdfjsLib) {
      // Use unpkg CDN for the worker - more reliable than cdnjs
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
    }
  }
  return pdfjsLib;
}

/**
 * Extract text content from a PDF file
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const pdfjs = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine text items from the page
      const pageText = (textContent.items as Array<{ str?: string }> )
        .map((item) => item.str || '')
        .join(' ');
      
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

