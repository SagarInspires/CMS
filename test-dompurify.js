const DOMPurify = require('isomorphic-dompurify');

const dirtyHtml = '<img src="/uploads/test.png" alt="Test Alt Text">';

const preProcessed = dirtyHtml
  .replace(/src=(["'])\//g, 'src=$1http://dummy.local/')
  .replace(/href=(["'])\//g, 'href=$1http://dummy.local/');

const sanitized = DOMPurify.sanitize(preProcessed, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'br', 'img'],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'class', 'width', 'height'],
});

const final = sanitized
  .replace(/src=(["'])http:\/\/dummy\.local\//g, 'src=$1/')
  .replace(/href=(["'])http:\/\/dummy\.local\//g, 'href=$1/');

console.log('FINAL OUTPUT:', final);
