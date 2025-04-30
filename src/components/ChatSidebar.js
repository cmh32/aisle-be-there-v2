import React from 'react';
import { PlusSquare, MessageSquare } from 'lucide-react'; // Using MessageSquare for chat icon

const ChatSidebar = ({
    chatList,
    activeChatId,
    startNewChat,
    switchToChat,
    // deleteChat, // Add later if needed
    // renameChat, // Add later if needed
}) => {

    return (
        <div className="chat-sidebar">
            <button className="new-chat-button" onClick={startNewChat}>
                <PlusSquare size={18} />
                <span>New Chat</span>
            </button>
            <nav className="chat-history-nav" aria-label="Chat History">
                <ul>
                    {chatList.map((chat) => (
                        <li key={chat.id} className={`chat-history-item ${chat.id === activeChatId ? 'active' : ''}`}>
                            <button onClick={() => switchToChat(chat.id)} className="chat-link-button">
                                <MessageSquare size={16} className="chat-icon"/>
                                <span className="chat-title">{chat.title || 'Untitled Chat'}</span>
                            </button>
                            {/* Add rename/delete icons/buttons here later */}
                        </li>
                    ))}
                    {chatList.length === 0 && (
                        <li className="no-chats-message">No chats yet.</li>
                    )}
                </ul>
            </nav>
            {/* Optional: Add settings or account info at the bottom */}
        </div>
    );
};

export default ChatSidebar; 