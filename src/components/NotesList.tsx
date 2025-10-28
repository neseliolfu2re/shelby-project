import React from 'react';
import { Note } from '../types';
import { NoteCard } from './NoteCard';
import { FileText, Clock } from 'lucide-react';

interface NotesListProps {
  notes: Note[];
  onReadNote: (noteId: number) => void;
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export const NotesList: React.FC<NotesListProps> = ({ 
  notes, 
  onReadNote, 
  isLoading = false,
  onLoadMore,
  hasMore = false
}) => {
  if (isLoading) {
    return (
      <div className="glass-card p-8">
        <div className="flex items-center space-x-2 mb-6">
          <FileText className="w-5 h-5 text-primary-500" />
          <h2 className="text-xl font-bold text-white">All Notes</h2>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="note-card animate-pulse">
              <div className="h-4 bg-white/20 rounded mb-3"></div>
              <div className="h-3 bg-white/10 rounded mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="glass-card p-8">
        <div className="flex items-center space-x-2 mb-6">
          <FileText className="w-5 h-5 text-primary-500" />
          <h2 className="text-xl font-bold text-white">All Notes</h2>
        </div>
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white/80 mb-2">No notes yet</h3>
          <p className="text-white/60 mb-4">Start by writing your first note!</p>
          <div className="inline-flex items-center space-x-2 text-white/40 text-sm">
            <Clock className="w-4 h-4" />
            <span>Notes will appear here</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-primary-500" />
          <h2 className="text-xl font-bold text-white">All Notes</h2>
        </div>
        <div className="bg-primary-500/20 text-primary-400 text-sm px-3 py-1 rounded-full">
          {notes.length} notes
        </div>
      </div>
      
      <div className="space-y-4">
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onRead={onReadNote}
          />
        ))}
      </div>

      {onLoadMore && hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="btn-secondary"
          >
            {isLoading ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
};
