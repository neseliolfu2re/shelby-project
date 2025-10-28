import { useState } from 'react';
import { Header } from './components/Header';
import { CreateNoteForm } from './components/CreateNoteForm';
import { TrendingNotes } from './components/TrendingNotes';
import { NotesList } from './components/NotesList';
import { useNotes } from './hooks/useNotes';
import { Eye, TrendingUp, FileText } from 'lucide-react';
import { useShelby } from './hooks/useShelby';

type TabType = 'trending' | 'all';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('trending');
  const { notes, trendingNotes, readNote, isLoading, createNote: createLocalNote, refreshNotes, loadMore, hasMore } = useNotes();
  const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false' && import.meta.env.VITE_USE_MOCK !== '0';
  const { downloadFile, getDownloadUrl } = useShelby({ apiKey: import.meta.env.VITE_SHELBY_API_KEY, network: 'shelbynet' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<string>('');
  const [modalTitle, setModalTitle] = useState<string>('');
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalVideoUrl, setModalVideoUrl] = useState<string | null>(null);

  const handleReadNote = async (noteId: number) => {
    try {
      await readNote(noteId);
      const note = notes.find(n => n.id === noteId);
      if (note) {
        setIsModalLoading(true);
        setModalError(null);
        setModalTitle(`Note #${note.id}`);
        try {
          const content = await downloadFile(note.shelbyHash);
          setModalContent(content);
          if (note.hasMedia && note.mediaHash) {
            const url = getDownloadUrl(note.mediaHash);
            setModalVideoUrl(url);
          } else {
            setModalVideoUrl(null);
          }
        } catch (e) {
          setModalError('Failed to load content from Shelby');
          setModalContent('');
        } finally {
          setIsModalLoading(false);
          setIsModalOpen(true);
        }
      }
    } catch (error) {
      console.error('Failed to read note:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Shelby Notes
          </h1>
          <p className="text-xl text-white/80 mb-6 max-w-3xl mx-auto">
            Share anonymous notes that glow brighter with every read. 
            <br />
            <span className="text-accent-400">Decentralized storage powered by Shelby Protocol</span>
          </p>
          <div className="flex items-center justify-center space-x-8 text-white/60">
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <span>{notes.reduce((sum, note) => sum + note.readCount, 0)} total reads</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>{notes.length} notes</span>
            </div>
          </div>
        </div>

        {/* Create Note Form */}
        <div className="mb-12">
          <CreateNoteForm onLocalCreate={USE_MOCK ? async (content, shelbyHash) => {
            await createLocalNote(content, shelbyHash);
          } : undefined} onRefreshChain={!USE_MOCK ? async () => {
            await refreshNotes();
          } : undefined} />
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8">
          <button
            onClick={() => setActiveTab('trending')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'trending'
                ? 'bg-accent-500 text-white shadow-lg'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span>Trending</span>
            {trendingNotes.length > 0 && (
              <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
                {trendingNotes.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'all'
                ? 'bg-primary-500 text-white shadow-lg'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>All Notes</span>
            <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
              {notes.length}
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {activeTab === 'trending' ? (
            <div className="lg:col-span-2">
              <TrendingNotes 
                trendingNotes={trendingNotes} 
                onReadNote={handleReadNote} 
              />
            </div>
          ) : (
            <div className="lg:col-span-2">
              <NotesList 
                notes={notes} 
                onReadNote={handleReadNote}
                isLoading={isLoading}
                onLoadMore={!USE_MOCK ? loadMore : undefined}
                hasMore={!USE_MOCK ? hasMore : false}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-white/50 text-sm">
          <p>
            Powered by <span className="text-accent-400 font-semibold">Shelby Protocol</span> & 
            <span className="text-primary-400 font-semibold"> Aptos Blockchain</span>
          </p>
          <p className="mt-2">
            Decentralized • Anonymous • Live • Micro Rewards
          </p>
        </footer>
      </main>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => { setIsModalOpen(false); setModalVideoUrl(null); }}>
          <div className="glass-card max-w-2xl w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">{modalTitle}</h3>
              <button onClick={() => { setIsModalOpen(false); setModalVideoUrl(null); }} className="text-white/70 hover:text-white">✕</button>
            </div>
            {isModalLoading ? (
              <div className="text-white/70">Loading...</div>
            ) : modalError ? (
              <div className="text-red-400 text-sm">{modalError}</div>
            ) : (
              <div className="space-y-4">
                <pre className="whitespace-pre-wrap text-white/90">{modalContent}</pre>
                {modalVideoUrl && (
                  <video controls className="w-full rounded-lg border border-white/10">
                    <source src={modalVideoUrl} />
                  </video>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
