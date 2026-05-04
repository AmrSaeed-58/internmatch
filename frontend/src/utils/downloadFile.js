/**
 * Trigger a browser download for an axios response that returned a Blob
 * (responseType: 'blob').
 *
 * Reads the original filename from the Content-Disposition header so the
 * extension matches the actual file (PDF, DOCX, CSV, ...) rather than being
 * forced to a fixed value. Falls back to `fallbackName` if the header is
 * missing or unparseable.
 *
 * Requires the backend to set:  exposedHeaders: ['Content-Disposition']  in
 * its CORS config — otherwise the browser hides the header from JS.
 */
export function downloadBlobFromResponse(response, fallbackName = 'download') {
  const blob = response.data;
  const filename = parseFilename(response.headers?.['content-disposition']) || fallbackName;

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function parseFilename(header) {
  if (!header) return null;
  // Prefer RFC 5987 filename* (UTF-8) when present
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      // fall through
    }
  }
  // Plain filename="..."
  const quoted = header.match(/filename="([^"]+)"/i);
  if (quoted) return quoted[1];
  // Bare filename=foo.pdf
  const bare = header.match(/filename=([^;]+)/i);
  if (bare) return bare[1].trim();
  return null;
}
