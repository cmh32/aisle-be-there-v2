// src/ChatbotPage.js
// Connects to your backend API endpoint (/api/chat) instead of OpenAI directly.

import React, { useState, useRef, useEffect } from 'react';
import usePersistentChatState from './hooks/usePersistentChatState'; // Import the custom hook
import ChatSidebar from './components/ChatSidebar'; // Import the sidebar component
import './WeddingPlannerApp.css'; // Ensure your CSS paths are correct

const ChatbotPage = ({
  guests,
  formattedWeddingDate,
  countdownDays,
  rsvpDeadlineDate,
  expenses,
  allottedBudget,
  vendors,
  timelineEvents
}) => {
  // Use the updated hook which now returns more items
  const [
    messages, 
    setMessages, 
    chatList, 
    activeChatId, 
    startNewChat, 
    switchToChat
  ] = usePersistentChatState();
  
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to the most recent message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Calculate wedding context to pass to the chatbot via the backend
  // (This helps formulate the System Message)
  const generateWeddingContext = () => {
    const totalGuests = guests?.length || 0; // Added fallback for guests potentially being undefined initially
    const confirmedGuests = guests?.filter(g => g.rsvpStatus === 'Confirmed').length || 0;
    const pendingGuests = guests?.filter(g => g.rsvpStatus === 'Pending').length || 0;
    const declinedGuests = guests?.filter(g => g.rsvpStatus === 'Declined').length || 0;

    const totalSpent = expenses?.reduce((total, expense) =>
      total + (Number(expense.actualCost) || Number(expense.estimatedCost) || 0), 0) || 0; // Added Number() and fallback
    const remainingBudget = (Number(allottedBudget) || 0) - totalSpent; // Added Number() and fallback

    const vendorCount = vendors?.length || 0;
    const vendorsWithContracts = vendors?.filter(v => v.contractStatus === 'Signed').length || 0;

    const upcomingEvents = timelineEvents?.filter(event => {
      // Basic check if event.date exists and is valid-ish before creating Date
      if (!event?.date) return false;
      try {
          const eventDate = new Date(event.date);
          // Check if date is valid before comparison
          return !isNaN(eventDate.getTime()) && eventDate > new Date();
      } catch(e) {
          console.warn("Could not parse timeline event date:", event.date);
          return false;
      }
    }).length || 0;

    return {
      weddingDate: formattedWeddingDate || "Not set",
      daysUntilWedding: countdownDays ?? "N/A", // Use ?? for nullish coalescing
      rsvpDeadline: rsvpDeadlineDate || "Not set",
      guests: {
        total: totalGuests,
        confirmed: confirmedGuests,
        pending: pendingGuests,
        declined: declinedGuests
      },
      budget: {
        allotted: Number(allottedBudget) || 0,
        spent: totalSpent,
        remaining: remainingBudget
      },
      vendors: {
        total: vendorCount,
        withContracts: vendorsWithContracts
      },
      timeline: {
        upcomingEvents: upcomingEvents
      }
    };
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // *** MODIFIED handleSubmit to call YOUR backend ***
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return; // Prevent multiple submissions

    const userMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      // Build context about the wedding plan to provide to the AI via system message
      const weddingContext = generateWeddingContext();

      // Prepare system message with instructions about the virtual wedding planner persona
      // (This is sent to your backend, which then sends it to OpenAI)
      const systemMessage = {
        role: 'system',
        content: `You are a "Virtual Wedding Planner" chatbot with the following traits:
        
        - Hyper-Organized & Detail-Oriented: Precise and structured, aware of the user's wedding details.
        - Knowledgeable & Informative: Provide reliable wedding planning information, timelines, budgets, etiquette.
        - Calm, Reassuring, & Patient: Always positive and supportive, never judgmental.
        - Proactive & Guiding: Suggest logical next steps based on their wedding planning progress.
        - Resourceful: Direct users to the right app sections (Guest List, Budget, Vendor Hub, Timeline, Reminders).
        - Empathetic & Encouraging: Use supportive language like "That sounds wonderful!" and "You're making great progress!".
        - Professional & Clear: Clear, concise communication with a warm, friendly tone.
        - Budget-Aware: Reference budget figures and help categorize/track expenses.
        - Aware of Limitations: Communicate clearly what you can and cannot do.

        Current wedding details:
        - Wedding date: ${weddingContext.weddingDate}
        - Days until wedding: ${weddingContext.daysUntilWedding}
        - RSVP deadline: ${weddingContext.rsvpDeadline}
        - Guests: ${weddingContext.guests.total} total (${weddingContext.guests.confirmed} confirmed, ${weddingContext.guests.pending} pending, ${weddingContext.guests.declined} declined)
        - Budget: $${(weddingContext.budget.allotted || 0).toLocaleString()} allotted, $${(weddingContext.budget.spent || 0).toLocaleString()} spent, $${(weddingContext.budget.remaining || 0).toLocaleString()} remaining
        - Vendors: ${weddingContext.vendors.total} total (${weddingContext.vendors.withContracts} with signed contracts)
        - Timeline: ${weddingContext.timeline.upcomingEvents} upcoming events

        When the user asks about app features, direct them to the relevant sections using the exact page names:
        - To manage guest list: "Guest List" page
        - To track budget: "Budget" page
        - To manage vendors: "Vendor Hub" page
        - To plan the wedding day schedule: "Timeline" page
        - To send reminders: "Reminders" page

        Keep responses concise but informative and always maintain a supportive, helpful tone.`
      };

      // Prepare conversation history for the backend API
      const apiMessages = [systemMessage];

      // Include the last ~10 messages from the conversation history for context
      // Adjust slice number as needed for context length vs token limits
      const recentMessages = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      apiMessages.push(...recentMessages, userMessage);

      // --- Make request to YOUR BACKEND API endpoint ---
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001'; // Use environment variable or default
      const chatEndpoint = `${backendUrl}/api/chat`;

      console.log(`Sending request to backend: ${chatEndpoint}`); // Log endpoint being called

      const response = await fetch(chatEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // NO 'Authorization' header here - The backend handles the secret key!
        },
        body: JSON.stringify({
          messages: apiMessages // Send the constructed message array
        })
      });

      // Check if the response from *your backend* is okay
      if (!response.ok) {
        let errorMsg = `Error contacting the planning assistant service (Status: ${response.status}).`;
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg; // Use error message from backend if available
        } catch (parseError) {
            // If backend didn't send JSON or response was empty
            console.error("Could not parse error response from backend:", parseError);
            errorMsg = `Received an invalid response from the planning assistant service (Status: ${response.status})`;
        }
        throw new Error(errorMsg);
      }

      // Expecting { reply: "..." } from your backend
      const data = await response.json();
      const botReply = data.reply;

      if (!botReply) {
           throw new Error("Received an empty reply from the planning assistant service.");
      }

      // Add assistant response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: botReply }]);

    } catch (error) {
      console.error('Chatbot Error:', error);
      // Show a user-friendly error message in the chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        // Provide the specific error message for easier debugging if needed
        content: `Sorry, I encountered an issue connecting to the planning assistant. Please try again later. (Details: ${error.message})`
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    // Update main container to use flex display for sidebar layout
    <div className="page-container chatbot-page-container with-sidebar">
      {/* Sidebar Component */}
      <ChatSidebar 
        chatList={chatList}
        activeChatId={activeChatId}
        startNewChat={startNewChat}
        switchToChat={switchToChat}
      />
      
      {/* Main Chat Area Container */}
      <div className="chatbot-main-area">
        <div className="chatbot-container">
          <header className="chatbot-header">
            <h1 className="chatbot-title">Wedding Planning Assistant</h1>
            <p className="chatbot-subtitle">Ask me anything about your wedding plan or general advice!</p>
          </header>

          {/* Chat Messages */}
          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
              >
                <div className="message-bubble">
                  {/* Basic link detection (replace with a library for robust detection if needed) */}
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
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            {/* Empty div to ensure scroll follows messages */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form className="chatbot-input-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Ask about your budget, guests, timeline, or wedding advice..."
              className="chatbot-input"
              disabled={isProcessing}
              aria-label="Chat input"
            />
            <button
              type="submit"
              className="send-button"
              disabled={isProcessing || !inputValue.trim()}
              aria-label="Send message"
            >
              {/* Send Icon SVG */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;