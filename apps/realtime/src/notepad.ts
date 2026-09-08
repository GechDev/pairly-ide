/**
 * Real-Time Shared Collaborative Notepad Store (FR-BOARD-02)
 *
 * Maintains an isolated document buffer for Markdown scratchpads per room,
 * completely segregated from the code workspace CRDT trees.
 */

export interface NotepadState {
  roomId: string;
  content: string;
  updatedAt: number;
  lastUpdatedBy?: string;
}

export class NotepadManager {
  private notes = new Map<string, NotepadState>();

  public getNotepad(roomId: string): NotepadState {
    const existing = this.notes.get(roomId);
    if (existing) return existing;

    const initial: NotepadState = {
      roomId,
      content: '# Collaborative Notes\n\n- Real-time scratchpad isolated from code workspace.\n- Supports Markdown formatting and live preview.\n',
      updatedAt: Date.now(),
    };
    this.notes.set(roomId, initial);
    return initial;
  }

  public updateNotepad(roomId: string, content: string, participantId?: string): NotepadState {
    const state: NotepadState = {
      roomId,
      content,
      updatedAt: Date.now(),
      lastUpdatedBy: participantId,
    };
    this.notes.set(roomId, state);
    return state;
  }

  public clearNotepad(roomId: string): void {
    this.notes.delete(roomId);
  }
}

export const defaultNotepadManager = new NotepadManager();
