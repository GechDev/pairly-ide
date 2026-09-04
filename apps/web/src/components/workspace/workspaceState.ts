export interface WorkspaceItem {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  content?: string;
  parentId?: string | null;
}

export interface WorkspaceState {
  items: WorkspaceItem[];
  activeFileId: string | null;
  openTabIds: string[];
}

export const DEFAULT_WORKSPACE_ITEMS: WorkspaceItem[] = [
  {
    id: 'file-main-ts',
    name: 'main.ts',
    path: '/main.ts',
    isFolder: false,
    content: `// Welcome to Pairly Collaborative IDE
// Real-time collaborative pair programming environment

function main() {
  console.log("Collaborative session active!");
}

main();`,
    parentId: null,
  },
  {
    id: 'folder-src',
    name: 'src',
    path: '/src',
    isFolder: true,
    parentId: null,
  },
  {
    id: 'file-utils-ts',
    name: 'utils.ts',
    path: '/src/utils.ts',
    isFolder: false,
    content: `export function formatName(name: string): string {
  return name.trim().toUpperCase();
}`,
    parentId: 'folder-src',
  },
  {
    id: 'file-readme',
    name: 'README.md',
    path: '/README.md',
    isFolder: false,
    content: `# Pairly Project
Collaborative coding workspace.`,
    parentId: null,
  },
];

export function createWorkspaceManager(initialItems: WorkspaceItem[] = DEFAULT_WORKSPACE_ITEMS) {
  let items = [...initialItems];
  let activeFileId = items.find((f) => !f.isFolder)?.id || null;
  let openTabIds = activeFileId ? [activeFileId] : [];

  const listeners = new Set<(state: WorkspaceState) => void>();

  const getState = (): WorkspaceState => ({
    items,
    activeFileId,
    openTabIds,
  });

  const notify = () => {
    const state = getState();
    for (const listener of listeners) {
      listener(state);
    }
  };

  const createFile = (name: string, isFolder = false, parentId: string | null = null, content = '') => {
    const parent = parentId ? items.find((i) => i.id === parentId) : null;
    const path = parent ? `${parent.path}/${name}` : `/${name}`;

    const newItem: WorkspaceItem = {
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name,
      path,
      isFolder,
      content: isFolder ? undefined : content,
      parentId,
    };

    items = [...items, newItem];
    if (!isFolder) {
      openTabIds = openTabIds.includes(newItem.id) ? openTabIds : [...openTabIds, newItem.id];
      activeFileId = newItem.id;
    }
    notify();
    return newItem;
  };

  const renameFile = (id: string, newName: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const parentPath = item.path.substring(0, item.path.lastIndexOf('/'));
    const newPath = `${parentPath}/${newName}`;

    items = items.map((i) => {
      if (i.id === id) {
        return { ...i, name: newName, path: newPath };
      }
      if (item.isFolder && i.path.startsWith(`${item.path}/`)) {
        return {
          ...i,
          path: `${newPath}${i.path.substring(item.path.length)}`,
        };
      }
      return i;
    });

    notify();
  };

  const deleteFile = (id: string) => {
    const itemToDelete = items.find((i) => i.id === id);
    if (!itemToDelete) return;

    const idsToDelete = new Set<string>([id]);
    if (itemToDelete.isFolder) {
      items.forEach((i) => {
        if (i.path.startsWith(`${itemToDelete.path}/`)) {
          idsToDelete.add(i.id);
        }
      });
    }

    items = items.filter((i) => !idsToDelete.has(i.id));
    openTabIds = openTabIds.filter((tabId) => !idsToDelete.has(tabId));

    if (activeFileId && idsToDelete.has(activeFileId)) {
      activeFileId = openTabIds[0] || null;
    }

    notify();
  };

  const updateFileContent = (id: string, newContent: string) => {
    items = items.map((i) => (i.id === id ? { ...i, content: newContent } : i));
    notify();
  };

  const openTab = (fileId: string) => {
    const item = items.find((i) => i.id === fileId);
    if (!item || item.isFolder) return;

    if (!openTabIds.includes(fileId)) {
      openTabIds = [...openTabIds, fileId];
    }
    activeFileId = fileId;
    notify();
  };

  const closeTab = (fileId: string) => {
    const newTabs = openTabIds.filter((id) => id !== fileId);
    openTabIds = newTabs;

    if (activeFileId === fileId) {
      activeFileId = newTabs[newTabs.length - 1] || null;
    }
    notify();
  };

  const setActiveTab = (fileId: string) => {
    if (openTabIds.includes(fileId)) {
      activeFileId = fileId;
      notify();
    }
  };

  const subscribe = (callback: (state: WorkspaceState) => void) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  };

  return {
    getState,
    createFile,
    renameFile,
    deleteFile,
    updateFileContent,
    openTab,
    closeTab,
    setActiveTab,
    subscribe,
  };
}
