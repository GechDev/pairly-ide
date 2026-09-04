import JSZip from 'jszip';
import type { WorkspaceItem } from '../components/workspace/workspaceState';

/**
 * Serializes workspace files into a downloadable ZIP archive.
 * Per SRS FR-EDIT-10.
 */
export async function exportWorkspaceAsZip(items: WorkspaceItem[]): Promise<Blob> {
  const zip = new JSZip();

  // Add all file contents
  for (const item of items) {
    if (!item.isFolder && item.content !== undefined) {
      // Remove leading slash for clean ZIP hierarchy
      const cleanPath = item.path.startsWith('/') ? item.path.slice(1) : item.path;
      zip.file(cleanPath, item.content);
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Deserializes an uploaded ZIP file into workspace items.
 * Per SRS FR-EDIT-10.
 */
export async function importZipToWorkspace(
  zipData: Blob | File | ArrayBuffer
): Promise<WorkspaceItem[]> {
  const zip = await JSZip.loadAsync(zipData);
  const items: WorkspaceItem[] = [];
  const folderPaths = new Set<string>();

  // Process all files in the ZIP archive
  const entries = Object.keys(zip.files);
  for (const relativePath of entries) {
    const entry = zip.files[relativePath];
    if (!entry) continue;

    const normalizedPath = `/${relativePath.replace(/\\/g, '/').replace(/\/$/, '')}`;
    const segments = normalizedPath.split('/').filter(Boolean);

    // Build intermediate folder items
    let currentPath = '';
    let parentFolderId: string | null = null;

    for (let i = 0; i < segments.length - 1; i++) {
      const folderName = segments[i]!;
      currentPath = `${currentPath}/${folderName}`;

      if (!folderPaths.has(currentPath)) {
        folderPaths.add(currentPath);
        const folderId = `folder-${folderName}-${Math.random().toString(36).substring(2, 6)}`;
        items.push({
          id: folderId,
          name: folderName,
          path: currentPath,
          isFolder: true,
          parentId: parentFolderId,
        });
        parentFolderId = folderId;
      } else {
        const existing = items.find((it) => it.path === currentPath);
        parentFolderId = existing?.id || null;
      }
    }

    // If it's a file, read its text content
    if (!entry.dir) {
      const fileName = segments[segments.length - 1] ?? 'unnamed';
      const text = await entry.async('string');
      items.push({
        id: `file-${fileName}-${Math.random().toString(36).substring(2, 6)}`,
        name: fileName,
        path: normalizedPath,
        isFolder: false,
        content: text,
        parentId: parentFolderId,
      });
    }
  }

  return items;
}

/**
 * Utility to trigger browser file download for a generated Blob.
 */
export function triggerFileDownload(blob: Blob, filename = 'workspace.zip'): void {
  if (typeof window === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
