import { useState, useCallback } from 'react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { useWallet } from './useWallet';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0x05bdead0d29dde8e07f2d859341ed05badd00aa62a1364f521f80864b133b09a";
const MODULE_NAME = "notes";

export const useAptosContract = () => {
  const { account, signAndSendTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const network = (import.meta.env.VITE_APTOS_NETWORK || 'devnet').toLowerCase() as 'devnet' | 'testnet' | 'mainnet';
  const aptos = new Aptos(new AptosConfig({ network: network === 'devnet' ? Network.DEVNET : network === 'testnet' ? Network.TESTNET : Network.MAINNET }));

  // Create a new note
  const createNote = useCallback(async (content: string, shelbyHash: string) => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        type: "entry_function_payload",
        function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::create_note`,
        arguments: [content, shelbyHash],
        type_arguments: []
      };

      const response = await signAndSendTransaction(payload);
      
      // Wait for transaction to complete
      await aptos.waitForTransaction({
        transactionHash: response.hash
      });

      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [account, signAndSendTransaction, aptos]);

  // Create a new note with media
  const createNoteWithMedia = useCallback(async (
    content: string,
    shelbyHash: string,
    mediaHash: string,
    mediaMime: string,
    mediaSize: number,
    thumbnailHash: string
  ) => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        type: "entry_function_payload",
        function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::create_note_with_media`,
        arguments: [content, shelbyHash, mediaHash, mediaMime, mediaSize, thumbnailHash],
        type_arguments: []
      };

      const response = await signAndSendTransaction(payload);
      await aptos.waitForTransaction({ transactionHash: response.hash });
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note with media');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [account, signAndSendTransaction, aptos]);

  // Read a note (increment read count)
  const readNote = useCallback(async (noteId: number) => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        type: "entry_function_payload",
        function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::read_note`,
        arguments: [noteId],
        type_arguments: []
      };

      const response = await signAndSendTransaction(payload);
      
      // Wait for transaction to complete
      await aptos.waitForTransaction({
        transactionHash: response.hash
      });

      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read note');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [account, signAndSendTransaction, aptos]);

  // Get all notes via view: first get ids, then map to notes
  const getAllNotes = useCallback(async () => {
    try {
      const idsRes = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_note_ids`,
          functionArguments: []
        }
      });

      const ids = (idsRes[0] as string[]) || [];
      if (ids.length === 0) return [] as any[];
      const notesRes = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_notes_by_ids`,
          functionArguments: [ids]
        }
      });
      return (notesRes[0] as any[]) || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notes');
      throw err;
    }
  }, [aptos]);

  // Get note by ID
  const getNote = useCallback(async (noteId: number) => {
    try {
      const res = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_note`,
          functionArguments: [String(noteId)]
        }
      });
      return res[0];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch note');
      throw err;
    }
  }, [aptos]);

  return {
    isLoading,
    error,
    createNote,
    createNoteWithMedia,
    readNote,
    getAllNotes,
    getNote,
    async getRecentNotes(limit: number, offset: number) {
      try {
        const idsRes = await aptos.view({
          payload: {
            function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_recent_note_ids`,
            functionArguments: [String(limit), String(offset)]
          }
        });
        const ids = (idsRes[0] as string[]) || [];
        if (ids.length === 0) return [] as any[];
        const notesRes = await aptos.view({
          payload: {
            function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_notes_by_ids`,
            functionArguments: [ids]
          }
        });
        return (notesRes[0] as any[]) || [];
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch recent notes');
        throw err;
      }
    }
  };
};
