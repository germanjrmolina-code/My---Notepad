"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Note = {
  id: string;
  title: string;
  description: string;
  updatedAt: string;
};

const storageKey = "little-notes";

function isNote(value: unknown): value is Note {
  if (typeof value !== "object" || value === null) return false;
  const note = value as Record<string, unknown>;
  return (
    typeof note.id === "string" &&
    typeof note.title === "string" &&
    typeof note.description === "string" &&
    typeof note.updatedAt === "string" &&
    !Number.isNaN(new Date(note.updatedAt).getTime())
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    try {
      const savedNotes = window.localStorage.getItem(storageKey);
      if (savedNotes) {
        const parsed: unknown = JSON.parse(savedNotes);
        if (Array.isArray(parsed)) {
          // Restoring browser-persisted state after hydration avoids server/client markup mismatches.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setNotes(parsed.filter(isNote));
        }
      }
    } catch {
      setStorageError(true);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(notes));
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStorageError(true);
    }
  }, [loaded, notes]);

  const visibleNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return notes
      .filter(
        (note) =>
          note.title.toLowerCase().includes(normalizedQuery) ||
          note.description.toLowerCase().includes(normalizedQuery),
      )
      .sort(
        (first, second) =>
          new Date(second.updatedAt).getTime() -
          new Date(first.updatedAt).getTime(),
      );
  }, [notes, query]);

  function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title")).trim();
    const description = String(formData.get("description")).trim();
    if (!title || !description) return;

    if (editingNote) {
      setNotes((currentNotes) =>
        currentNotes.map((note) =>
          note.id === editingNote.id
            ? { ...note, title, description, updatedAt: new Date().toISOString() }
            : note,
        ),
      );
    } else {
      setNotes((currentNotes) => [
        {
          id: crypto.randomUUID(),
          title,
          description,
          updatedAt: new Date().toISOString(),
        },
        ...currentNotes,
      ]);
    }
    setEditingNote(null);
    setIsCreating(false);
    setStorageError(false);
  }

  function closeEditor() {
    setEditingNote(null);
    setIsCreating(false);
  }

  const editorOpen = isCreating || editingNote !== null;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="Memo home">
          <span className="brand-mark" aria-hidden="true">m</span>
          <span>memo<span className="brand-period">.</span></span>
        </Link>
        <div className="sidebar-label">YOUR DESK</div>
        <button className="sidebar-link active" aria-current="page">
          <span className="sidebar-icon" aria-hidden="true">▤</span>
          <span>All notes</span>
          <span className="sidebar-count">{notes.length}</span>
        </button>
        <button className="sidebar-compose" onClick={() => setIsCreating(true)}>
          <span aria-hidden="true">＋</span> Write a note
        </button>
        <div className="sidebar-bottom">
          <span className="status-dot" />
          <span>Saved on this device</span>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <span className="breadcrumb">WORKSPACE <span>/</span> NOTES</span>
          <span className="topbar-caption">A clear mind starts here.</span>
        </header>

        <div className="workspace">
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">YOUR SPACE TO THINK</p>
              <h1>Catch the thought.<br /><span>Keep the idea.</span></h1>
              <p className="welcome-copy">
                A home for passing thoughts, plans, and bright ideas.
              </p>
              <button className="new-note-button" onClick={() => setIsCreating(true)}>
                <span aria-hidden="true">＋</span> Create a note
              </button>
            </div>
            <div className="hero-art" aria-hidden="true">
              <span className="art-orbit orbit-one" />
              <span className="art-orbit orbit-two" />
              <span className="art-star">✳</span>
              <span className="art-caption">MAKE<br />ROOM</span>
            </div>
            <div className="hero-index">01 <span>—</span> YOUR NOTEBOOK</div>
          </section>

          <div className="notes-toolbar">
            <div>
              <p className="section-kicker">THE COLLECTION</p>
              <div className="section-heading">
                <h2>Notes</h2>
                <span className="note-count">{notes.length}</span>
              </div>
            </div>
            <label className="search-box">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
              <input
                type="search"
                placeholder="Find a note"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search notes"
              />
              <span className="search-shortcut" aria-hidden="true">⌕</span>
            </label>
          </div>

          {storageError && (
            <p className="storage-warning" role="status">
              Notes could not be saved in this browser. Check your browser storage settings.
            </p>
          )}

          {!loaded ? (
            <div className="empty-state"><p>Loading your notes...</p></div>
          ) : visibleNotes.length > 0 ? (
            <div className="notes-grid">
              {visibleNotes.map((note, index) => (
                <article className={`note-card note-card-${index % 4}`} key={note.id}>
                  <div className="note-card-top">
                    <span className="note-index">NOTE {String(index + 1).padStart(2, "0")}</span>
                    <div className="note-actions">
                      <button
                        className="icon-button"
                        onClick={() => setEditingNote(note)}
                        aria-label={`Edit ${note.title}`}
                        title="Edit note"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="m14 5 5 5M4 20l4.5-1 10.7-10.7a2.1 2.1 0 0 0-3-3L5.5 16 4 20Z" />
                        </svg>
                      </button>
                      <button
                        className="icon-button delete-button"
                        onClick={() => {
                          setNotes((currentNotes) =>
                            currentNotes.filter((item) => item.id !== note.id),
                          );
                          setStorageError(false);
                        }}
                        aria-label={`Delete ${note.title}`}
                        title="Delete note"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <h3>{note.title}</h3>
                  <p className="note-description">{note.description}</p>
                  <div className="note-card-footer">
                    <span>{formatDate(note.updatedAt)}</span>
                    <span className="card-arrow" aria-hidden="true">↗</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon" aria-hidden="true">✳</span>
              <h3>{query ? "Nothing came up" : "Start with a blank page"}</h3>
              <p>
                {query
                  ? "Try another search term."
                  : "Save a thought before it gets away. Your notes stay right here on this device."}
              </p>
              {!query && (
                <button className="text-button" onClick={() => setIsCreating(true)}>
                  Make your first note <span aria-hidden="true">↗</span>
                </button>
              )}
            </div>
          )}

          <footer className="page-footer">
            <span>ONE THOUGHT AT A TIME.</span>
            <span>{notes.length} {notes.length === 1 ? "NOTE" : "NOTES"} IN YOUR COLLECTION</span>
          </footer>
        </div>
      </section>

      {editorOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditor();
          }}
        >
          <section
            className="note-editor"
            role="dialog"
            aria-modal="true"
            aria-labelledby="editor-title"
          >
            <div className="editor-heading">
              <div>
                <p className="eyebrow">{editingNote ? "REFINE THE THOUGHT" : "GET IT DOWN"}</p>
                <h2 id="editor-title">{editingNote ? "Edit your note" : "New note"}</h2>
              </div>
              <button className="icon-button close-button" onClick={closeEditor} aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <form onSubmit={saveNote}>
               <label className="field-label" htmlFor="note-title">Title</label>
              <input
                autoFocus
                id="note-title"
                name="title"
                maxLength={80}
                placeholder="Give your note a title"
                defaultValue={editingNote?.title ?? ""}
                required
              />
              <label className="field-label" htmlFor="note-description">Description</label>
              <textarea
                id="note-description"
                name="description"
                rows={6}
                placeholder="What's on your mind?"
                defaultValue={editingNote?.description ?? ""}
                required
              />
              <div className="editor-footer">
                <button type="button" className="cancel-button" onClick={closeEditor}>
                  Cancel
                </button>
                <button type="submit" className="new-note-button">
                  {editingNote ? "Save changes" : "Save note"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
