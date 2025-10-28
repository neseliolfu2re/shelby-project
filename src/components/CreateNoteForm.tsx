import React, { useState } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { useShelby } from '../hooks/useShelby';
import { useAptosContract } from '../hooks/useAptosContract';
import { useWallet } from '../hooks/useWallet';

interface CreateNoteFormProps {
  onLocalCreate?: (content: string, shelbyHash: string) => Promise<any> | void;
  onRefreshChain?: () => Promise<void>;
}

export const CreateNoteForm: React.FC<CreateNoteFormProps> = ({ onLocalCreate, onRefreshChain }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  
  const { isConnected, account } = useWallet();
  const { uploadFile, isLoading: shelbyLoading, error: shelbyError, uploadBlob } = useShelby({
    apiKey: import.meta.env.VITE_SHELBY_API_KEY,
    network: 'shelbynet'
  });
  
  const { createNote, createNoteWithMedia, isLoading: contractLoading, error: contractError } = useAptosContract();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || isSubmitting) return;
    setLocalError(null);
    setSuccessMsg(null);
    
    console.log('Wallet connected:', isConnected);
    console.log('Account:', account);
    
    if (!isConnected) {
      setLocalError('Please connect your wallet first');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Upload content to Shelby
      const shelbyHash = await uploadFile(content);
      let mediaHash = '';
      let mediaMime = '';
      let mediaSize = 0;
      let thumbnailHash = '';
      if (videoFile) {
        // Basic mime/size checks
        if (!['video/mp4', 'video/webm'].includes(videoFile.type)) {
          throw new Error('Unsupported video format');
        }
        if (videoFile.size > 50 * 1024 * 1024) {
          throw new Error('Max video size is 50MB');
        }
        mediaHash = await uploadBlob(videoFile);
        mediaMime = videoFile.type;
        mediaSize = videoFile.size;
      }

      // Create note on Aptos blockchain
      if (mediaHash) {
        await createNoteWithMedia(content, shelbyHash, mediaHash, mediaMime, mediaSize, thumbnailHash);
      } else {
        await createNote(content, shelbyHash);
      }

      // Update local UI state immediately
      if (onLocalCreate) {
        await onLocalCreate(content, shelbyHash);
      }
      if (onRefreshChain) {
        await onRefreshChain();
      }
      
      // Reset form
      setContent('');
      setVideoFile(null);
      setVideoPreview(null);
      setSuccessMsg('Note created successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (error) {
      console.error('Failed to create note:', error);
      setLocalError('Failed to create note. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || shelbyLoading || contractLoading;
  const error = localError || shelbyError || contractError;

  return (
    <div className="glass-card p-8">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-5 h-5 text-accent-500" />
        <h2 className="text-xl font-bold text-white">Write New Note</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts anonymously... The more your note is read, the brighter it glows! ✨"
            className="input-field min-h-[120px] resize-none"
            maxLength={500}
            disabled={isLoading}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-white/50">
              {content.length}/500 characters
            </span>
            {error && (
              <span className="text-xs text-red-400">
                {error}
              </span>
            )}
          </div>
        </div>
        {/* Optional Video Upload */}
        <div className="space-y-2">
          <input
            type="file"
            accept="video/mp4,video/webm"
            disabled={isLoading}
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setVideoFile(f);
              setVideoPreview(f ? URL.createObjectURL(f) : null);
            }}
            className="text-sm text-white/80 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-500/20 file:text-primary-300 hover:file:bg-primary-500/30"
          />
          {videoPreview && (
            <video src={videoPreview} controls className="w-full rounded-lg border border-white/10" />
          )}
          <p className="text-xs text-white/40">Optional: add a short video (MP4/WEBM, max 50MB).</p>
        </div>
        
        <button
          type="submit"
          disabled={!content.trim() || isLoading}
          className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading to Shelby...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Share Note</span>
            </>
          )}
        </button>
        {successMsg && (
          <div className="text-center text-green-400 text-sm">
            {successMsg}
          </div>
        )}
      </form>
      
      <div className="mt-4 text-xs text-white/60 text-center">
        <p>Your note is securely stored on Shelby Protocol</p>
        <p>Earn micro rewards for every read</p>
      </div>
    </div>
  );
};
