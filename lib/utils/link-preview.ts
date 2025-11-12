/**
 * Link Preview Utilities
 * Extract Open Graph metadata from URLs
 */

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
}

// Detect URLs in text
export function detectUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches || [];
}

// Extract domain from URL
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return "";
  }
}

// Fetch Open Graph metadata from URL
export async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  try {
    // Use a CORS proxy for client-side fetching
    // In production, you should use your own backend API
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl, {
      headers: {
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch URL');
    }

    const html = await response.text();
    
    // Parse Open Graph tags
    const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)?.[1];
    const ogDescription = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i)?.[1];
    const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)?.[1];
    const ogSiteName = html.match(/<meta\s+property="og:site_name"\s+content="([^"]+)"/i)?.[1];

    // Fallback to regular meta tags
    const title = ogTitle || html.match(/<title>([^<]+)<\/title>/i)?.[1];
    const description = ogDescription || html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1];
    
    // Get favicon
    const favicon = `https://www.google.com/s2/favicons?domain=${extractDomain(url)}&sz=32`;

    if (!title && !description && !ogImage) {
      return null; // No useful metadata found
    }

    return {
      url,
      title: title?.trim(),
      description: description?.trim(),
      image: ogImage,
      siteName: ogSiteName,
      favicon,
    };
  } catch (error) {
    console.error('Error fetching link preview:', error);
    return null;
  }
}

// Validate if URL is safe to preview
export function isSafeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol;
    
    // Only allow HTTP and HTTPS
    if (protocol !== 'http:' && protocol !== 'https:') {
      return false;
    }

    // Block known malicious patterns
    const maliciousPatterns = [
      'javascript:',
      'data:',
      'file:',
      'vbscript:',
    ];

    const lowerUrl = url.toLowerCase();
    return !maliciousPatterns.some(pattern => lowerUrl.includes(pattern));
  } catch {
    return false;
  }
}

// Shorten URL for display
export function shortenUrl(url: string, maxLength: number = 50): string {
  if (url.length <= maxLength) return url;
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace("www.", "");
    const path = urlObj.pathname + urlObj.search;
    
    if (path.length > maxLength - domain.length - 3) {
      return `${domain}${path.substring(0, maxLength - domain.length - 3)}...`;
    }
    
    return `${domain}${path}`;
  } catch {
    return url.substring(0, maxLength) + '...';
  }
}
