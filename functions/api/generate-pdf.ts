interface Env {
  TYPST_EXPORT_TOKEN: string;
  HOOK_TYPST_EXPORT_URL: string;
  ALLOWED_ORIGINS: string;
}

interface PDFRequest {
  title: string;
  content: string;
  venue: string;
  decisionMaker: string;
  context: {
    identity?: string;
    audience?: string;
    venue?: string;
    level?: string;
  };
}

// Rate limiting store (in-memory, resets on function restart)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_CONTENT_SIZE = 50 * 1024; // 50KB

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Validate origin
    const origin = request.headers.get('origin');
    const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || [
      'https://dryvest.pages.dev',
      'http://localhost:5173'
    ];

    if (!origin || !allowedOrigins.includes(origin)) {
      console.warn('Unauthorized origin:', origin);
      return new Response('Unauthorized origin', { status: 403 });
    }

    // Rate limiting by IP
    const clientIP = request.headers.get('cf-connecting-ip') || 'unknown';
    const now = Date.now();
    const userRate = rateLimitStore.get(clientIP);

    if (userRate) {
      if (now < userRate.resetTime) {
        if (userRate.count >= RATE_LIMIT) {
          const retryAfter = Math.ceil((userRate.resetTime - now) / 1000);
          return new Response('Rate limit exceeded', {
            status: 429,
            headers: { 'Retry-After': retryAfter.toString() }
          });
        }
        userRate.count++;
      } else {
        // Reset window
        rateLimitStore.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      }
    } else {
      rateLimitStore.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }

    // Parse and validate request
    const body: PDFRequest = await request.json();

    if (!body.title || !body.content) {
      return new Response('Missing required fields: title and content', { status: 400 });
    }

    // Check content size
    if (body.content.length > MAX_CONTENT_SIZE) {
      return new Response('Content too large (max 50KB)', { status: 413 });
    }

    // Sanitize content (basic XSS prevention)
    const sanitizedContent = sanitizeContent(body.content);

    // Prepare PDF generation payload
    const pdfPayload = {
      title: body.title.slice(0, 200), // Limit title length
      content: sanitizedContent,
      metadata: {
        venue: body.venue || 'Investment Committee',
        decisionMaker: body.decisionMaker || 'Board of Trustees',
        context: body.context || {},
        generatedAt: new Date().toISOString(),
        source: 'Dryvest - Ethical Capital'
      }
    };

    // Call PDF generation service
    const pdfResponse = await fetch(env.HOOK_TYPST_EXPORT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.TYPST_EXPORT_TOKEN}`,
        'User-Agent': 'Dryvest-PDF-Generator/1.0'
      },
      body: JSON.stringify(pdfPayload)
    });

    if (!pdfResponse.ok) {
      console.error('PDF service error:', pdfResponse.status, await pdfResponse.text());
      return new Response('PDF generation service unavailable', { status: 503 });
    }

    // Return PDF response
    const pdfBlob = await pdfResponse.blob();

    return new Response(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${sanitizeFilename(body.title)}.pdf"`,
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return new Response('Internal server error', { status: 500 });
  }
};

/**
 * Basic content sanitization to prevent XSS
 */
function sanitizeContent(content: string): string {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .slice(0, MAX_CONTENT_SIZE);
}

/**
 * Sanitize filename for PDF download
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9\s-]/gi, '')
    .replace(/\s+/g, '_')
    .toLowerCase()
    .substring(0, 50);
}