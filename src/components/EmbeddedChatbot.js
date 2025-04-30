// src/components/EmbeddedChatbot.js
import React, { useState, useRef, useEffect } from 'react';
import { MessagesSquare, X, Send } from 'lucide-react';
import { generateWeddingContext, createSystemPrompt } from '../chatUtils'; // Import from the new utility file
import usePersistentChatState from '../hooks/usePersistentChatState'; // Re-import the hook
import '../WeddingPlannerApp.css'; // Assuming styles will be added here

const EmbeddedChatbot = (props) => {
    // Props needed for context generation
    const {
        guests, formattedWeddingDate, countdownDays, rsvpDeadlineDate,
        expenses, allottedBudget, vendors, timelineEvents
        // Add any other context props passed from App.js here
    } = props;

    const [isOpen, setIsOpen] = useState(false);
    // Get the full state and functions from the hook
    const [
        messages,       // Messages for the hook's current active chat
        setMessages,    // Function to update messages in the hook/localStorage
        _chatList,      // Not used here
        _activeChatId,  // The hook instance's active ID (we manage it via switchToChat)
        _startNewChat,  // Not used here
        switchToChat,   // Function to switch the hook's active chat
        latestChatId    // The ID of the most recently updated chat across all histories
    ] = usePersistentChatState();

    // No separate local message state needed anymore
    const [inputValue, setInputValue] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Effect to synchronize with the latest chat when opened
    useEffect(() => {
        if (isOpen && latestChatId) {
            console.log(`[EmbeddedChatbot] Opened. Ensuring sync with latest chat: ${latestChatId}`);
            // Switch the hook's internal state to the latest chat
            // This will update the `messages` variable returned by the hook
            switchToChat(latestChatId);
             // Focus input after potentially loading messages
            setTimeout(() => inputRef.current?.focus(), 100);
        } else if (isOpen && !latestChatId) {
             // Handle the edge case where there are no chats at all yet
             console.log("[EmbeddedChatbot] Opened, but no latest chat found (likely first time use).");
             // The hook initializes with a default new chat, so `messages` should be the default.
             setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, latestChatId, switchToChat]); // Rerun when isOpen or latestChatId changes

    // Auto-scroll to the most recent message
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]); // Scrolls when the hook's messages change

    const toggleChat = () => {
        setIsOpen(!isOpen);
        // If closing, we don't need to do anything extra
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    // handleSubmit now directly uses the hook's setMessages
    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedInput = inputValue.trim();
        if (!trimmedInput || isProcessing) return;

        const userMessage = { role: 'user', content: trimmedInput };
        // Update the hook's state directly. This triggers the hook's useEffect to save.
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);

        setInputValue('');
        setIsProcessing(true);

        try {
            const weddingContext = generateWeddingContext({
                 guests, formattedWeddingDate, countdownDays, rsvpDeadlineDate,
                 expenses, allottedBudget, vendors, timelineEvents
            });
            const systemMessage = createSystemPrompt(weddingContext);

            const apiMessages = [systemMessage];
             // Use the latest message state for the API call
            const recentMessages = updatedMessages.slice(-6).map(msg => ({
                role: msg.role,
                content: msg.content
            }));
            // Ensure userMessage isn't duplicated (though unlikely with this flow)
            if (!recentMessages.some(m => m.role === 'user' && m.content === userMessage.content)) {
                 apiMessages.push(...recentMessages, userMessage);
            } else {
                 apiMessages.push(...recentMessages);
            }

            const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
            const chatEndpoint = `${backendUrl}/api/chat`;

            const response = await fetch(chatEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: apiMessages })
            });

            if (!response.ok) {
                let errorMsg = `Assistant Error (Status: ${response.status})`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch { /* Ignore parsing error */ }
                throw new Error(errorMsg);
            }

            const data = await response.json();
            const botReply = data.reply;

            if (!botReply) {
                throw new Error("Received empty reply from assistant.");
            }

            const assistantMessage = { role: 'assistant', content: botReply };
            // Update hook state with the response
            setMessages(prev => [...prev, assistantMessage]);

        } catch (error) {
            console.error('Embedded Chatbot Error:', error);
            const errorMessage = { role: 'assistant', content: `Sorry, I couldn't connect. Please try again. (${error.message})` };
            // Update hook state with error message
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsProcessing(false);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    };

    return (
        <>
            {/* Chat Trigger Button */}
            <button
                className="embedded-chatbot-trigger"
                onClick={toggleChat}
                title="Ask Wedding Assistant"
                aria-label="Toggle Wedding Assistant Chat"
            >
                <MessagesSquare size={24} />
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="embedded-chat-window" role="dialog" aria-modal="true" aria-labelledby="chat-window-header">
                    {/* Header */}
                    <header className="chat-window-header" id="chat-window-header">
                        <span>Wedding Assistant</span>
                        <button onClick={toggleChat} className="chat-window-close-btn" aria-label="Close chat">
                            <X size={20} />
                        </button>
                    </header>

                    {/* Messages Area - Renders `messages` from the hook */}
                    <div className="chat-window-messages">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
                            >
                                <div className="message-bubble">
                                    {/* Basic link detection */}
                                    {message.content.split(/(\bhttps?:\/\/\S+)/gi).map((part, i) =>
                                        part.match(/^https?:\/\//) ? (
                                            <a key={i} href={part} target="_blank" rel="noopener noreferrer">{part}</a>
                                        ) : (
                                            part
                                        )
                                    )}
                                </div>
                            </div>
                        ))}
                         {/* Typing Indicator */}
                         {isProcessing && (
                             <div className="message assistant-message">
                                 <div className="message-bubble typing-indicator">
                                     <span></span><span></span><span></span>
                                 </div>
                             </div>
                         )}
                        <div ref={messagesEndRef} /> {/* Scroll target */}
                    </div>

                    {/* Input Form */}
                    <form className="chat-window-input-form" onSubmit={handleSubmit}>
                        <input
                            ref={inputRef} // Add ref to the input
                            type="text"
                            value={inputValue}
                            onChange={handleInputChange}
                            placeholder="Ask a question..."
                            className="chatbot-input" // Reuse existing style?
                            disabled={isProcessing}
                            aria-label="Chat message input"
                        />
                        <button
                            type="submit"
                            className="send-button" // Reuse existing style?
                            disabled={isProcessing || !inputValue.trim()}
                            aria-label="Send message"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default EmbeddedChatbot;
