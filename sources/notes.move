module shelby_notes::notes {
    use std::string::String;
    use std::vector;
    use std::table::{Self, Table};
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use std::signer;

    // Note struct - Shelby'de saklanacak
    struct Note has key, store, copy, drop {
        id: u64,
        content: String,
        author: address,
        created_at: u64,
        read_count: u64,
        shelby_hash: String, // Shelby'deki dosya hash'i
        has_media: bool,
        media_hash: String,
        media_mime: String,
        media_size: u64,
        thumbnail_hash: String,
    }

    // Global storage
    struct NotesStorage has key {
        notes: Table<u64, Note>,
        note_ids: vector<u64>,
        next_id: u64,
        total_notes: u64,
    }

    // Events
    #[event]
    struct NoteCreatedEvent has store, drop {
        id: u64,
        author: address,
        content: String,
        shelby_hash: String,
    }

    #[event]
    struct NoteReadEvent has store, drop {
        id: u64,
        reader: address,
        new_read_count: u64,
    }

    // Initialize
    public entry fun initialize(account: &signer) {
        let account_addr = signer::address_of(account);
        move_to(account, NotesStorage {
            notes: table::new(),
            note_ids: vector::empty<u64>(),
            next_id: 1,
            total_notes: 0,
        });
    }

    // Create a new note
    public entry fun create_note(
        account: &signer,
        content: String,
        shelby_hash: String
    ) acquires NotesStorage {
        // Basic input validation
        assert!(std::string::length(&content) > 0, 1001);
        assert!(std::string::length(&content) <= 500, 1002);
        assert!(std::string::length(&shelby_hash) > 0, 1003);
        let account_addr = signer::address_of(account);
        let notes_storage = borrow_global_mut<NotesStorage>(@shelby_notes);
        
        let note_id = notes_storage.next_id;
        let current_time = timestamp::now_seconds();
        
        let note = Note {
            id: note_id,
            content,
            author: account_addr,
            created_at: current_time,
            read_count: 0,
            shelby_hash,
            has_media: false,
            media_hash: std::string::utf8(b""),
            media_mime: std::string::utf8(b""),
            media_size: 0,
            thumbnail_hash: std::string::utf8(b""),
        };
        
        table::add(&mut notes_storage.notes, note_id, note);
        vector::push_back(&mut notes_storage.note_ids, note_id);
        notes_storage.next_id = note_id + 1;
        notes_storage.total_notes = notes_storage.total_notes + 1;
        
        // Emit event
        event::emit(NoteCreatedEvent {
            id: note_id,
            author: account_addr,
            content: note.content,
            shelby_hash: note.shelby_hash,
        });
    }

    // Create a new note with media
    public entry fun create_note_with_media(
        account: &signer,
        content: String,
        shelby_hash: String,
        media_hash: String,
        media_mime: String,
        media_size: u64,
        thumbnail_hash: String
    ) acquires NotesStorage {
        // Basic input validation
        assert!(std::string::length(&content) > 0, 1001);
        assert!(std::string::length(&content) <= 500, 1002);
        assert!(std::string::length(&shelby_hash) > 0, 1003);
        assert!(media_size > 0, 1101);
        // very simple mime check, frontend should enforce
        let mime_len = std::string::length(&media_mime);
        assert!(mime_len > 0, 1102);

        let account_addr = signer::address_of(account);
        let notes_storage = borrow_global_mut<NotesStorage>(@shelby_notes);

        let note_id = notes_storage.next_id;
        let current_time = timestamp::now_seconds();

        let note = Note {
            id: note_id,
            content,
            author: account_addr,
            created_at: current_time,
            read_count: 0,
            shelby_hash,
            has_media: true,
            media_hash,
            media_mime,
            media_size,
            thumbnail_hash,
        };

        table::add(&mut notes_storage.notes, note_id, note);
        vector::push_back(&mut notes_storage.note_ids, note_id);
        notes_storage.next_id = note_id + 1;
        notes_storage.total_notes = notes_storage.total_notes + 1;
    }

    // Read a note (increments read count)
    public entry fun read_note(account: &signer, note_id: u64) acquires NotesStorage {
        let reader_addr = signer::address_of(account);
        let notes_storage = borrow_global_mut<NotesStorage>(@shelby_notes);
        
        assert!(table::contains(&notes_storage.notes, note_id), 1); // Note not found
        
        let note = table::borrow_mut(&mut notes_storage.notes, note_id);
        note.read_count = note.read_count + 1;
        
        // Emit event
        event::emit(NoteReadEvent {
            id: note_id,
            reader: reader_addr,
            new_read_count: note.read_count,
        });
    }

    // Get note by ID
    #[view]
    public fun get_note(note_id: u64): Note acquires NotesStorage {
        let notes_storage = borrow_global<NotesStorage>(@shelby_notes);
        assert!(table::contains(&notes_storage.notes, note_id), 1);
        *table::borrow(&notes_storage.notes, note_id)
    }

    // Get all note ids
    #[view]
    public fun get_note_ids(): vector<u64> acquires NotesStorage {
        let s = borrow_global<NotesStorage>(@shelby_notes);
        let out = vector::empty<u64>();
        let i = 0u64;
        let len = vector::length(&s.note_ids);
        while (i < len) {
            let id_ref = vector::borrow(&s.note_ids, i);
            vector::push_back(&mut out, *id_ref);
            i = i + 1;
        };
        out
    }

    // Get notes by ids (batch view)
    #[view]
    public fun get_notes_by_ids(ids: vector<u64>): vector<Note> acquires NotesStorage {
        let s = borrow_global<NotesStorage>(@shelby_notes);
        let out = vector::empty<Note>();
        let i = 0u64;
        let len = vector::length(&ids);
        while (i < len) {
            let id_ref = vector::borrow(&ids, i);
            if (table::contains(&s.notes, *id_ref)) {
                let note = *table::borrow(&s.notes, *id_ref);
                vector::push_back(&mut out, note);
            };
            i = i + 1;
        };
        out
    }

    // Get recent note ids with pagination (most recent first)
    #[view]
    public fun get_recent_note_ids(limit: u64, offset: u64): vector<u64> acquires NotesStorage {
        let s = borrow_global<NotesStorage>(@shelby_notes);
        let len = vector::length(&s.note_ids);
        if (offset >= len) {
            return vector::empty<u64>();
        };
        let out = vector::empty<u64>();
        let count = 0u64;
        let idx = len - 1 - offset;
        while (count < limit) {
            let id_ref = vector::borrow(&s.note_ids, idx);
            vector::push_back(&mut out, *id_ref);
            count = count + 1;
            if (idx == 0) { break; };
            idx = idx - 1;
        };
        out
    }

    // Get trending notes (most read)
    public fun get_trending_notes(limit: u64): vector<Note> {
        // Bu fonksiyon gerçekte sorting algoritması gerektirir
        // Şimdilik boş vector döndürüyoruz
        vector::empty<Note>()
    }

    // Get total notes count
    #[view]
    public fun get_total_notes(): u64 acquires NotesStorage {
        let notes_storage = borrow_global<NotesStorage>(@shelby_notes);
        notes_storage.total_notes
    }

    // Get note read count
    #[view]
    public fun get_note_read_count(note_id: u64): u64 acquires NotesStorage {
        let note = get_note(note_id);
        note.read_count
    }
}
