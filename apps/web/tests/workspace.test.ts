import { describe, it, expect } from 'vitest';
import {
  createWorkspaceManager,
  type WorkspaceItem,
} from '../src/components/workspace/workspaceState';
import { exportWorkspaceAsZip, importZipToWorkspace } from '../src/lib/zip';

describe('T-09: Multi-File Workspace Tree, Tab Management, and ZIP Serialization', () => {
  it('performs file and folder CRUD operations with path integrity', () => {
    const manager = createWorkspaceManager([]);
    expect(manager.getState().items).toHaveLength(0);

    // 1. Create a root folder
    const folder = manager.createFile('src', true, null);
    expect(folder.path).toBe('/src');
    expect(folder.isFolder).toBe(true);

    // 2. Create nested file inside src
    const file = manager.createFile('index.ts', false, folder.id, 'console.log("hello");');
    expect(file.path).toBe('/src/index.ts');
    expect(file.content).toBe('console.log("hello");');
    expect(manager.getState().activeFileId).toBe(file.id);
    expect(manager.getState().openTabIds).toContain(file.id);

    // 3. Update file content
    manager.updateFileContent(file.id, 'console.log("updated");');
    expect(
      manager.getState().items.find((i) => i.id === file.id)?.content
    ).toBe('console.log("updated");');

    // 4. Rename file
    manager.renameFile(file.id, 'app.ts');
    expect(manager.getState().items.find((i) => i.id === file.id)?.path).toBe(
      '/src/app.ts'
    );

    // 5. Delete folder cascades to children
    manager.deleteFile(folder.id);
    expect(manager.getState().items).toHaveLength(0);
    expect(manager.getState().openTabIds).not.toContain(file.id);
  });

  it('manages tab opening, active switching, and closing fallback', () => {
    const manager = createWorkspaceManager([]);
    const fileA = manager.createFile('a.ts', false, null, 'code A');
    const fileB = manager.createFile('b.ts', false, null, 'code B');
    const fileC = manager.createFile('c.ts', false, null, 'code C');

    expect(manager.getState().openTabIds).toEqual([fileA.id, fileB.id, fileC.id]);
    expect(manager.getState().activeFileId).toBe(fileC.id);

    // Switch active tab
    manager.setActiveTab(fileA.id);
    expect(manager.getState().activeFileId).toBe(fileA.id);

    // Close active tab -> should fallback to remaining tab
    manager.closeTab(fileA.id);
    expect(manager.getState().openTabIds).toEqual([fileB.id, fileC.id]);
    expect(manager.getState().activeFileId).toBe(fileC.id);
  });

  it('serializes workspace items to ZIP and reconstructs them cleanly (FR-EDIT-10)', async () => {
    const items: WorkspaceItem[] = [
      {
        id: '1',
        name: 'package.json',
        path: '/package.json',
        isFolder: false,
        content: '{"name": "test-pkg"}',
      },
      {
        id: '2',
        name: 'src',
        path: '/src',
        isFolder: true,
      },
      {
        id: '3',
        name: 'index.ts',
        path: '/src/index.ts',
        isFolder: false,
        parentId: '2',
        content: 'export const value = 42;',
      },
    ];

    // Export to ZIP blob
    const zipBlob = await exportWorkspaceAsZip(items);
    expect(zipBlob.size).toBeGreaterThan(0);

    // Re-import from ZIP blob
    const reconstructed = await importZipToWorkspace(zipBlob);

    // Verify reconstructed files
    const packageJson = reconstructed.find((i) => i.name === 'package.json');
    expect(packageJson).toBeDefined();
    expect(packageJson?.content).toBe('{"name": "test-pkg"}');

    const indexTs = reconstructed.find((i) => i.name === 'index.ts');
    expect(indexTs).toBeDefined();
    expect(indexTs?.content).toBe('export const value = 42;');
    expect(indexTs?.path).toBe('/src/index.ts');
  });
});
