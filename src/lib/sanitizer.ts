import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(dirtyHtml: string): string {
  if (!dirtyHtml) return '';

  // Bypass JSDOM about:blank URI resolution bug in isomorphic-dompurify for relative URLs
  // JSDOM prepends about:blank to relative URLs, which DOMPurify strictly blocks as an XSS vector.
  // We temporarily prefix a safe absolute protocol before sanitization and restore it after.
  const preProcessed = dirtyHtml
    .replace(/src=(["'])\//g, 'src=$1http://dummy.local/')
    .replace(/href=(["'])\//g, 'href=$1http://dummy.local/');

  const sanitized = DOMPurify.sanitize(preProcessed, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'br', 'img'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'class', 'width', 'height'],
  });

  return sanitized
    .replace(/src=(["'])http:\/\/dummy\.local\//g, 'src=$1/')
    .replace(/href=(["'])http:\/\/dummy\.local\//g, 'href=$1/');
}
