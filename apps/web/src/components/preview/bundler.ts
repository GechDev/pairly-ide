import type { WorkspaceItem } from '../workspace/workspaceState';

export interface BundlerResult {
  html: string;
  durationMs: number;
  entrypoint: string;
  hasErrors: boolean;
  errors: string[];
}

/**
 * Sandboxed In-Memory HTML/CSS/JS Bundler.
 * Bundles multi-file workspace items into an isolated HTML document in <300ms per FR-PREV-01..02.
 * Inlines scripts, styles, and assets with CSP meta headers to prevent network/storage exfiltration (FR-PREV-03).
 */
export function bundleWorkspaceForPreview(items: WorkspaceItem[]): BundlerResult {
  const startTime = performance.now();
  const errors: string[] = [];

  // 1. Locate entrypoint HTML file
  const htmlFiles = items.filter(
    (item) => !item.isFolder && item.name.toLowerCase().endsWith('.html')
  );

  let entrypoint = 'index.html';
  let htmlItem =
    htmlFiles.find((f) => f.name.toLowerCase() === 'index.html') ||
    htmlFiles[0];

  let rawHtml = '';

  if (htmlItem && htmlItem.content) {
    rawHtml = htmlItem.content;
    entrypoint = htmlItem.name;
  } else {
    // Construct default preview wrapper if no HTML file exists
    entrypoint = 'index.html (virtual)';
    const jsOrTsFile = items.find(
      (item) =>
        !item.isFolder &&
        (item.name.endsWith('.js') ||
          item.name.endsWith('.ts') ||
          item.name.endsWith('.jsx') ||
          item.name.endsWith('.tsx'))
    );
    const cssFile = items.find(
      (item) => !item.isFolder && item.name.endsWith('.css')
    );

    rawHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pairly Live Preview</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 2rem;
      background: #0f172a;
      color: #f8fafc;
    }
  </style>
  ${cssFile ? `<link rel="stylesheet" href="${cssFile.name}">` : ''}
</head>
<body>
  <div id="app"></div>
  <div id="root"></div>
  ${jsOrTsFile ? `<script src="${jsOrTsFile.name}"></script>` : ''}
</body>
</html>`;
  }

  // 2. Build file lookup maps by path and name
  const fileMap = new Map<string, string>();
  for (const item of items) {
    if (!item.isFolder && item.content !== undefined) {
      fileMap.set(item.name.toLowerCase(), item.content);
      fileMap.set(item.path.toLowerCase(), item.content);
      // Normalized relative path
      const relPath = item.path.replace(/^\//, '').toLowerCase();
      fileMap.set(relPath, item.content);
    }
  }

  let bundledHtml = rawHtml;

  // 3. Inline CSS <link rel="stylesheet" href="...">
  bundledHtml = bundledHtml.replace(
    /<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi,
    (match, href: string) => {
      const cleanHref = href.replace(/^\.\//, '').toLowerCase();
      const cssContent = fileMap.get(cleanHref);
      if (cssContent !== undefined) {
        return `<style data-source="${href}">\n${cssContent}\n</style>`;
      }
      return match;
    }
  );

  // 4. Inline JS <script src="...">
  bundledHtml = bundledHtml.replace(
    /<script\s+[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi,
    (match, src: string) => {
      const cleanSrc = src.replace(/^\.\//, '').toLowerCase();
      const jsContent = fileMap.get(cleanSrc);
      if (jsContent !== undefined) {
        return `<script data-source="${src}">\n${jsContent}\n</script>`;
      }
      return match;
    }
  );

  // 5. Inject Preview Console Interceptor, CSP meta header, and Error Banner Overlay
  const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data: https: blob:; font-src data:; connect-src 'none';">`;

  const consoleScript = `
${cspMeta}
<script>
  (function() {
    function showRuntimeError(msg, line, col) {
      let banner = document.getElementById('__pairly_error_banner__');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = '__pairly_error_banner__';
        banner.style.cssText = 'position:fixed;bottom:10px;left:10px;right:10px;background:#881337;color:#ffe4e6;padding:10px 14px;border-radius:8px;font-family:ui-monospace,monospace;font-size:12px;z-index:999999;box-shadow:0 10px 25px rgba(0,0,0,0.5);border:1px solid #e11d48;';
        document.body ? document.body.appendChild(banner) : document.documentElement.appendChild(banner);
      }
      banner.innerHTML = '<strong>Preview Error:</strong> ' + String(msg) + (line ? ' (Line ' + line + ':' + (col||0) + ')' : '');
    }

    // Intercept errors and forward to parent window
    window.onerror = function(msg, url, line, col, error) {
      showRuntimeError(msg, line, col);
      try {
        window.parent.postMessage({
          type: 'PREVIEW_ERROR',
          message: String(msg),
          line: line,
          col: col
        }, '*');
      } catch(e) {}
      return false;
    };

    // Intercept console.log and errors
    const origLog = console.log;
    const origErr = console.error;
    console.log = function(...args) {
      origLog.apply(console, args);
      try {
        window.parent.postMessage({
          type: 'PREVIEW_CONSOLE',
          level: 'log',
          text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
        }, '*');
      } catch(e) {}
    };
    console.error = function(...args) {
      origErr.apply(console, args);
      try {
        window.parent.postMessage({
          type: 'PREVIEW_CONSOLE',
          level: 'error',
          text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
        }, '*');
      } catch(e) {}
    };
  })();
</script>
`;

  // Inject console interceptor into <head> or before </body>
  if (bundledHtml.includes('</head>')) {
    bundledHtml = bundledHtml.replace('</head>', `${consoleScript}\n</head>`);
  } else if (bundledHtml.includes('</body>')) {
    bundledHtml = bundledHtml.replace('</body>', `${consoleScript}\n</body>`);
  } else {
    bundledHtml += consoleScript;
  }

  const durationMs = Math.round(performance.now() - startTime);

  return {
    html: bundledHtml,
    durationMs,
    entrypoint,
    hasErrors: errors.length > 0,
    errors,
  };
}
