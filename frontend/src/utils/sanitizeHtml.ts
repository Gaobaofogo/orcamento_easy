/**
 * Sanitizes HTML content to prevent XSS attacks while allowing rich text formatting.
 */
export function sanitizeHtml(htmlString: string | undefined | null): string {
  if (!htmlString) return '';

  // If the string doesn't contain HTML tags, convert newlines to <br /> or <p>
  if (!/<[a-z][\s\S]*>/i.test(htmlString)) {
    return htmlString
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => `<p>${line}</p>`)
      .join('');
  }

  // Basic DOMParser sanitization for web environment
  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, 'text/html');
      
      // Remove dangerous tags
      const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'base', 'head', 'link', 'meta'];
      dangerousTags.forEach(tag => {
        const elements = doc.querySelectorAll(tag);
        elements.forEach(el => el.remove());
      });

      // Remove dangerous attributes like onload, onerror, onclick, etc., and javascript: hrefs
      const allElements = doc.querySelectorAll('*');
      allElements.forEach(el => {
        Array.from(el.attributes).forEach(attr => {
          const attrName = attr.name.toLowerCase();
          const attrVal = attr.value.toLowerCase().trim();

          if (attrName.startsWith('on') || attrVal.startsWith('javascript:')) {
            el.removeAttribute(attr.name);
          }
        });
      });

      return doc.body.innerHTML;
    } catch (e) {
      // Fallback regex sanitization if parser fails
    }
  }

  // Regex fallback sanitization
  return htmlString
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:[^\s'"]+/gi, '');
}
