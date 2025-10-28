import { useState, useEffect, useCallback } from 'react';
import { Note, TrendingNote } from '../types';
import { useAptosContract } from './useAptosContract';

// Mock Aptos contract interaction
const MOCK_NOTES: Note[] = [
  {
    id: 1,
    content: "Shelby Protocol is truly revolutionary! Decentralized storage is the future 🚀",
    author: "0x123...abc",
    createdAt: Date.now() - 3600000, // 1 hour ago
    readCount: 42,
    shelbyHash: "shelby_1234567890_abc123"
  },
  {
    id: 2,
    content: "Anonymous note sharing is such a creative concept. Everyone can share their thoughts freely 💭",
    author: "0x456...def",
    createdAt: Date.now() - 7200000, // 2 hours ago
    readCount: 28,
    shelbyHash: "shelby_1234567891_def456"
  },
  {
    id: 3,
    content: "Data ownership in Web3 is now real! With Shelby, we control our own data 🔐",
    author: "0x789...ghi",
    createdAt: Date.now() - 1800000, // 30 minutes ago
    readCount: 15,
    shelbyHash: "shelby_1234567892_ghi789"
  },
  {
    id: 4,
    content: "The glow effect is mesmerizing! Notes literally shine brighter with popularity ✨",
    author: "0xabc...123",
    createdAt: Date.now() - 900000, // 15 minutes ago
    readCount: 8,
    shelbyHash: "shelby_1234567893_abc123"
  },
  {
    id: 5,
    content: "Micro rewards for content creators - this is how Web3 should work! 💰",
    author: "0xdef...456",
    createdAt: Date.now() - 10800000, // 3 hours ago
    readCount: 35,
    shelbyHash: "shelby_1234567894_def456"
  }
];

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_USE_MOCK === '1';

export const useNotes = () => {
  const { getAllNotes, readNote: readNoteOnChain, createNote: createNoteOnChain, getRecentNotes } = useAptosContract();
  const [notes, setNotes] = useState<Note[]>(USE_MOCK ? MOCK_NOTES : []);
  const [trendingNotes, setTrendingNotes] = useState<TrendingNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  // Calculate trending notes based on read count and recency
  const calculateTrending = useCallback((notesList: Note[]): TrendingNote[] => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    return notesList
      .map(note => {
        const age = now - note.createdAt;
        const ageFactor = Math.max(0, 1 - (age / oneDay)); // Newer notes get higher score
        const trendScore = note.readCount * (1 + ageFactor * 0.5);
        
        return {
          ...note,
          rank: 0, // Will be set after sorting
          trendScore
        };
      })
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, 10)
      .map((note, index) => ({
        ...note,
        rank: index + 1
      }));
  }, []);

  // Create a new note
  const createNote = useCallback(async (content: string, shelbyHash: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newNote: Note = {
          id: Math.max(...notes.map(n => n.id), 0) + 1,
          content,
          author: "0x" + Math.random().toString(16).substr(2, 8) + "...",
          createdAt: Date.now(),
          readCount: 0,
          shelbyHash
        };
        setNotes(prev => [newNote, ...prev]);
        return newNote;
      } else {
        await createNoteOnChain(content, shelbyHash);
        // Refresh from chain
        const chainNotes = await getAllNotes();
        setNotes(chainNotes.map(mapMoveNoteToNote));
        return null as unknown as Note;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [notes, getAllNotes, createNoteOnChain]);

  // Read a note (increment read count)
  const readNote = useCallback(async (noteId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setNotes(prev => 
          prev.map(note => 
            note.id === noteId 
              ? { ...note, readCount: note.readCount + 1 }
              : note
          )
        );
      } else {
        await readNoteOnChain(noteId);
        const chainNotes = await getAllNotes();
        setNotes(chainNotes.map(mapMoveNoteToNote));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read note');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getAllNotes, readNoteOnChain]);

  // Update trending notes when notes change
  useEffect(() => {
    setTrendingNotes(calculateTrending(notes));
  }, [notes, calculateTrending]);

  // Initial load from chain when not mocking
  useEffect(() => {
    const load = async () => {
      if (!USE_MOCK) {
        setIsLoading(true);
        try {
          const batch = await getRecentNotes(PAGE_SIZE, 0);
          const mapped = batch.map(mapMoveNoteToNote);
          setNotes(mapped);
          setHasMore(batch.length === PAGE_SIZE);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch notes');
        } finally {
          setIsLoading(false);
        }
      }
    };
    load();
  }, [getRecentNotes]);

  const refreshNotes = useCallback(async () => {
    if (USE_MOCK) return;
    setIsLoading(true);
    try {
      const batch = await getRecentNotes(PAGE_SIZE, 0);
      const mapped = batch.map(mapMoveNoteToNote);
      setNotes(mapped);
      setHasMore(batch.length === PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notes');
    } finally {
      setIsLoading(false);
    }
  }, [getRecentNotes]);

  const loadMore = useCallback(async () => {
    if (USE_MOCK) return;
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const batch = await getRecentNotes(PAGE_SIZE, notes.length);
      const mapped = batch.map(mapMoveNoteToNote);
      setNotes(prev => [...prev, ...mapped]);
      setHasMore(batch.length === PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch more notes');
    } finally {
      setIsLoading(false);
    }
  }, [getRecentNotes, notes.length, hasMore, isLoading]);

  return {
    notes,
    trendingNotes,
    isLoading,
    error,
    createNote,
    readNote,
    totalNotes: notes.length,
    refreshNotes,
    loadMore,
    hasMore
  };
};

function mapMoveNoteToNote(moveNote: any): Note {
  const id = Number(moveNote.id ?? 0);
  const content = String(moveNote.content ?? '');
  const author = String(moveNote.author ?? '');
  const createdAtSec = Number(moveNote.created_at ?? 0);
  const readCount = Number(moveNote.read_count ?? 0);
  const shelbyHash = String(moveNote.shelby_hash ?? '');
  const hasMedia = Boolean(moveNote.has_media ?? false);
  const mediaHash = moveNote.media_hash ? String(moveNote.media_hash) : undefined;
  const mediaMime = moveNote.media_mime ? String(moveNote.media_mime) : undefined;
  const mediaSize = moveNote.media_size ? Number(moveNote.media_size) : undefined;
  const thumbnailHash = moveNote.thumbnail_hash ? String(moveNote.thumbnail_hash) : undefined;
  return {
    id,
    content,
    author,
    createdAt: createdAtSec * 1000,
    readCount,
    shelbyHash,
    hasMedia,
    mediaHash,
    mediaMime,
    mediaSize,
    thumbnailHash,
  };
}
