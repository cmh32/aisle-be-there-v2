import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Need a way to generate unique IDs

const HISTORIES_KEY = 'weddingPlannerChatHistories';
const ACTIVE_ID_KEY = 'weddingPlannerActiveChatId';

const DEFAULT_ASSISTANT_MESSAGE = 'Hello! How can I assist with your wedding planning today?';

// Helper to get initial state from localStorage
const loadInitialState = () => {
    console.log("[usePersistentChatState] Initializing state...");
    let histories = {};
    let activeChatId = null;
    let initialMessages = [{ role: 'assistant', content: DEFAULT_ASSISTANT_MESSAGE }];

    try {
        const savedHistories = localStorage.getItem(HISTORIES_KEY);
        if (savedHistories) {
            histories = JSON.parse(savedHistories);
            console.log(`[usePersistentChatState] Loaded ${Object.keys(histories).length} histories from localStorage.`);
        }

        activeChatId = localStorage.getItem(ACTIVE_ID_KEY);

        if (activeChatId && histories[activeChatId] && Array.isArray(histories[activeChatId].messages)) {
            initialMessages = histories[activeChatId].messages;
            console.log(`[usePersistentChatState] Found active chat (${activeChatId}) with ${initialMessages.length} messages.`);
        } else {
            // If no active chat ID, or ID not found, or messages invalid -> create a new one
            console.log("[usePersistentChatState] No valid active chat found or history empty. Creating new chat.");
            activeChatId = `chat_${uuidv4()}`;
            initialMessages = [{ role: 'assistant', content: DEFAULT_ASSISTANT_MESSAGE }];
            histories[activeChatId] = {
                id: activeChatId,
                title: 'New Chat',
                messages: initialMessages,
                createdAt: Date.now()
            };
            localStorage.setItem(HISTORIES_KEY, JSON.stringify(histories));
            localStorage.setItem(ACTIVE_ID_KEY, activeChatId);
            console.log(`[usePersistentChatState] Created and set new active chat: ${activeChatId}`);
        }
    } catch (error) {
        console.error("[usePersistentChatState] Failed to load state from localStorage", error);
        // Fallback to a single new chat in case of error
        activeChatId = `chat_${uuidv4()}`;
        initialMessages = [{ role: 'assistant', content: DEFAULT_ASSISTANT_MESSAGE }];
        histories = {
            [activeChatId]: {
                id: activeChatId,
                title: 'New Chat',
                messages: initialMessages,
                createdAt: Date.now()
            }
        };
        // Attempt to clear potentially corrupted storage
        localStorage.removeItem(HISTORIES_KEY);
        localStorage.removeItem(ACTIVE_ID_KEY);
        // Save the clean state
        localStorage.setItem(HISTORIES_KEY, JSON.stringify(histories));
        localStorage.setItem(ACTIVE_ID_KEY, activeChatId);
    }

    // Ensure histories format is correct (object)
    if (Array.isArray(histories)) {
        console.warn("[usePersistentChatState] Histories were an array, converting to object.");
        histories = histories.reduce((acc, chat) => {
            if (chat && chat.id) {
                acc[chat.id] = chat;
            }
            return acc;
        }, {});
        localStorage.setItem(HISTORIES_KEY, JSON.stringify(histories));
    }

    return { histories, activeChatId, initialMessages };
};

function usePersistentChatState() {
    const [chatHistories, setChatHistories] = useState(() => loadInitialState().histories);
    const [activeChatId, setActiveChatId] = useState(() => loadInitialState().activeChatId);
    const [messages, setMessages] = useState(() => loadInitialState().initialMessages);

    // Update localStorage whenever the messages for the active chat change
    useEffect(() => {
        if (!activeChatId || !chatHistories[activeChatId]) return; // Safety check

        const currentActiveChat = chatHistories[activeChatId];

        // Avoid saving if messages haven't actually changed from the stored version
        if (JSON.stringify(currentActiveChat.messages) === JSON.stringify(messages)) {
            // console.log(`[usePersistentChatState] Messages for ${activeChatId} haven't changed, skipping save.`);
            return;
        }

        // Generate title from first user message if title is still 'New Chat'
        let newTitle = currentActiveChat.title;
        if (newTitle === 'New Chat' && messages.length > 1 && messages[1]?.role === 'user') {
            newTitle = messages[1].content.substring(0, 30) + (messages[1].content.length > 30 ? '...' : '');
            console.log(`[usePersistentChatState] Auto-generating title for ${activeChatId}: "${newTitle}"`);
        }

        const updatedHistories = {
            ...chatHistories,
            [activeChatId]: {
                ...currentActiveChat,
                title: newTitle, // Update title if generated
                messages: messages,
                updatedAt: Date.now() // Track last update
            }
        };

        console.log(`[usePersistentChatState] Saving messages for active chat: ${activeChatId} (${messages.length} messages)`);
        try {
            localStorage.setItem(HISTORIES_KEY, JSON.stringify(updatedHistories));
            // Update the state tracking all histories as well
            setChatHistories(updatedHistories);
        } catch (error) {
            console.error("[usePersistentChatState] Failed to save histories to localStorage", error);
        }
    }, [messages, activeChatId, chatHistories]); // Rerun when messages or active chat changes

    // Function to start a new chat
    const startNewChat = useCallback(() => {
        console.log("[usePersistentChatState] Starting new chat...");
        const newChatId = `chat_${uuidv4()}`;
        const newMessages = [{ role: 'assistant', content: DEFAULT_ASSISTANT_MESSAGE }];
        const newChat = {
            id: newChatId,
            title: 'New Chat',
            messages: newMessages,
            createdAt: Date.now()
        };

        const updatedHistories = {
            ...chatHistories,
            [newChatId]: newChat
        };

        setChatHistories(updatedHistories); // Update histories state
        setActiveChatId(newChatId);       // Update active ID state
        setMessages(newMessages);         // Update current messages state

        try {
            localStorage.setItem(HISTORIES_KEY, JSON.stringify(updatedHistories));
            localStorage.setItem(ACTIVE_ID_KEY, newChatId);
            console.log(`[usePersistentChatState] New chat created and activated: ${newChatId}`);
        } catch (error) {
            console.error("[usePersistentChatState] Failed to save new chat state to localStorage", error);
        }
    }, [chatHistories]); // Dependency: chatHistories to include previous chats

    // Function to switch to an existing chat
    const switchToChat = useCallback((chatId) => {
        if (chatId === activeChatId || !chatHistories[chatId]) {
            console.log(`[usePersistentChatState] Already on chat ${chatId} or chat not found.`);
            return;
        }
        console.log(`[usePersistentChatState] Switching to chat: ${chatId}`);
        setActiveChatId(chatId);
        setMessages(chatHistories[chatId].messages);
        try {
            localStorage.setItem(ACTIVE_ID_KEY, chatId);
        } catch (error) {
            console.error("[usePersistentChatState] Failed to save active chat ID to localStorage", error);
        }
    }, [activeChatId, chatHistories]); // Dependencies: activeChatId and chatHistories

    // Prepare chat list for the sidebar (simplified view)
    const sortedChats = Object.values(chatHistories)
        .sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)); // Sort by most recently updated/created
        
    const chatList = sortedChats.map(chat => ({
        id: chat.id,
        title: chat.title
    }));
    
    // Get the ID of the most recent chat
    const latestChatId = sortedChats.length > 0 ? sortedChats[0].id : null;

    // TODO: Add deleteChat and renameChat functions later if needed

    // Return latestChatId as well
    return [messages, setMessages, chatList, activeChatId, startNewChat, switchToChat, latestChatId];
}

export default usePersistentChatState; 