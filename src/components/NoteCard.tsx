import React from 'react';
import { Note } from '../types';
import { Eye, Clock, User, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

interface NoteCardProps {
  note: Note;
  onRead: (noteId: number) => void;
  isTrending?: boolean;
  rank?: number;
}

export const NoteCard: React.FC<NoteCardProps> = ({ 
  note, 
  onRead, 
  isTrending = false, 
  rank 
}) => {
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getGlowIntensity = (readCount: number) => {
    if (readCount > 50) return 'animate-glow';
    if (readCount > 20) return 'ring-2 ring-accent-500';
    if (readCount > 10) return 'ring-1 ring-primary-500';
    return '';
  };

  return (
    <div 
      className={clsx(
        'note-card cursor-pointer group',
        isTrending && 'trending',
        getGlowIntensity(note.readCount)
      )}
      onClick={() => onRead(note.id)}
    >
      {/* Rank badge for trending notes */}
      {isTrending && rank && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-accent-500 to-accent-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
          #{rank}
        </div>
      )}

      {/* Note content */}
      <div className="mb-4">
        <p className="text-white/90 leading-relaxed group-hover:text-white transition-colors">
          {note.content}
        </p>
      </div>

      {/* Note metadata */}
      <div className="flex items-center justify-between text-sm text-white/60">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Eye className="w-4 h-4" />
            <span className="font-medium">{note.readCount}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{formatTime(note.createdAt)}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isTrending && (
            <Sparkles className="w-4 h-4 text-accent-500 animate-pulse" />
          )}
          <div className="flex items-center space-x-1">
            <User className="w-4 h-4" />
            <span className="font-mono text-xs">{note.author}</span>
          </div>
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-accent-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};
