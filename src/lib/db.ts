import Dexie, { type EntityTable } from 'dexie';
import type { ClassItem, Note, Page } from './types';

class ScribeDatabase extends Dexie {
  classes!: EntityTable<ClassItem, 'id'>;
  notes!: EntityTable<Note, 'id'>;
  pages!: EntityTable<Page, 'id'>;

  constructor() {
    super('scribe-db');
    this.version(1).stores({
      classes: 'id, order, createdAt, updatedAt',
      notes: 'id, classId, date, createdAt, updatedAt, *tags',
      pages: 'id, noteId, order',
    });
  }
}

export const db = new ScribeDatabase();

export async function createClass(name: string, gradient: string): Promise<ClassItem> {
  const id = crypto.randomUUID();
  const now = Date.now();
  const count = await db.classes.count();
  const cls: ClassItem = { id, name, gradient, order: count, createdAt: now, updatedAt: now };
  await db.classes.add(cls);
  return cls;
}

export async function updateClass(id: string, updates: Partial<ClassItem>): Promise<void> {
  await db.classes.update(id, { ...updates, updatedAt: Date.now() });
}

export async function deleteClass(id: string): Promise<void> {
  const notes = await db.notes.where('classId').equals(id).toArray();
  for (const note of notes) {
    await db.pages.where('noteId').equals(note.id).delete();
  }
  await db.notes.where('classId').equals(id).delete();
  await db.classes.delete(id);
}

export async function createNote(
  classId: string,
  title?: string,
  dateOverride?: string,
  options?: {
    template?: Note['template'];
    pageType?: Note['pageType'];
    paperColor?: Note['paperColor'];
  }
): Promise<Note> {
  let defaultTemplate: Note['template'] = 'blank';
  let defaultPageType: Note['pageType'] = 'paginated'; // GoodNotes style continuous pages by default
  let defaultPaperColor: Note['paperColor'] = 'navy'; // Midnight Navy like in user's screenshot
  if (typeof window !== 'undefined') {
    try {
      const settings = JSON.parse(localStorage.getItem('scribe-settings') || '{}');
      if (settings.defaultTemplate) defaultTemplate = settings.defaultTemplate;
      if (settings.defaultPageType) defaultPageType = settings.defaultPageType;
      if (settings.defaultPaperColor) defaultPaperColor = settings.defaultPaperColor;
    } catch (e) {}
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  const note: Note = {
    id,
    classId,
    date: dateOverride || new Date().toISOString().split('T')[0],
    title: title || `Note ${new Date().toLocaleDateString()}`,
    tags: [],
    template: options?.template || defaultTemplate,
    pageType: options?.pageType || defaultPageType,
    paperColor: options?.paperColor || defaultPaperColor,
    createdAt: now,
    updatedAt: now,
  };
  await db.notes.add(note);
  const pageId = crypto.randomUUID();
  const page: Page = {
    id: pageId,
    noteId: id,
    order: 0,
    strokes: [],
    textBoxes: [],
    images: [],
  };
  await db.pages.add(page);
  return note;
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<void> {
  await db.notes.update(id, { ...updates, updatedAt: Date.now() });
}

export async function deleteNote(id: string): Promise<void> {
  await db.pages.where('noteId').equals(id).delete();
  await db.notes.delete(id);
}

export async function getPagesForNote(noteId: string): Promise<Page[]> {
  return db.pages.where('noteId').equals(noteId).sortBy('order');
}

export async function updatePage(id: string, updates: Partial<Page>): Promise<void> {
  await db.pages.update(id, updates);
}

export async function addPage(noteId: string, order?: number): Promise<Page> {
  let nextOrder = order;
  if (nextOrder === undefined) {
    const existing = await db.pages.where('noteId').equals(noteId).toArray();
    nextOrder = existing.length;
  }
  const page: Page = {
    id: crypto.randomUUID(),
    noteId,
    order: nextOrder,
    strokes: [],
    textBoxes: [],
    images: [],
  };
  await db.pages.add(page);
  return page;
}

export async function deletePage(pageId: string): Promise<void> {
  await db.pages.delete(pageId);
}

export async function getNotesForClass(classId: string): Promise<Note[]> {
  return db.notes.where('classId').equals(classId).sortBy('updatedAt');
}

export async function getAllClasses(): Promise<ClassItem[]> {
  return db.classes.orderBy('order').toArray();
}

export async function searchAll(query: string): Promise<{ notes: Note[]; classes: ClassItem[] }> {
  const q = query.toLowerCase();
  const allNotes = await db.notes.toArray();
  const allClasses = await db.classes.toArray();
  const matchedNotes = allNotes.filter(
    n => n.title.toLowerCase().includes(q) || n.tags.some(t => t.toLowerCase().includes(q))
  );
  const matchedClasses = allClasses.filter(c => c.name.toLowerCase().includes(q));
  return { notes: matchedNotes, classes: matchedClasses };
}
