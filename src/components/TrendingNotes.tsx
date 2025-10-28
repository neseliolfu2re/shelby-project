import React from 'react';
import { TrendingNote } from '../types';
import { NoteCard } from './NoteCard';
import { TrendingUp, Sparkles } from 'lucide-react';

interface TrendingNotesProps {
  trendingNotes: TrendingNote[];
  onReadNote: (noteId: number) => void;
}

export const TrendingNotes: React.FC<TrendingNotesProps> = ({ 
  trendingNotes, 
  onReadNote 
}) => {
  if (trendingNotes.length === 0) {
    return (
      <div className="glass-card p-8">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-accent-500" />
          <h2 className="text-xl font-bold text-white">Trending Notes</h2>
        </div>
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/60">No trending notes yet</p>
          <p className="text-white/40 text-sm">Write your first note and make it trend!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-8">
      <div className="flex items-center space-x-2 mb-6">
        <TrendingUp className="w-5 h-5 text-accent-500" />
        <h2 className="text-xl font-bold text-white">Trending Notes</h2>
        <div className="bg-accent-500/20 text-accent-400 text-xs px-2 py-1 rounded-full">
          {trendingNotes.length} notes
        </div>
      </div>
      
      <div className="space-y-4">
        {trendingNotes.map((note) => (
          <div key={note.id} className="relative">
            <NoteCard
              note={note}
              onRead={onReadNote}
              isTrending={true}
              rank={note.rank}
            />
            
            {/* Trend score indicator */}
            <div className="absolute top-4 right-4 bg-gradient-to-r from-accent-500/20 to-primary-500/20 text-white/80 text-xs px-2 py-1 rounded-full">
              {Math.round(note.trendScore)} puan
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-xs text-white/50 text-center">
        <p>Trending algorithm is calculated based on read count and recency</p>
      </div>
    </div>
  );
};
