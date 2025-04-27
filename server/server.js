// server/server.js - Includes BOTH /api/generate-reminders AND the NEW /api/chat endpoint
require('dotenv').config(); // Load .env variables FIRST
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const axios = require('axios'); // <<< ADDED: Make sure you've run 'npm install axios' in the 'server' directory

const app = express();
const port = process.env.PORT || 3001;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

// --- Load Config Info ---
const senderNames = process.env.SENDER_NAMES || "The Happy Couple";
const openAIKey = process.env.OPENAI_API_KEY; // Use this variable consistently

// --- Middleware ---
app.use(cors({ origin: clientOrigin }));
app.use(express.json()); // To parse JSON request bodies

// --- Initialize OpenAI Client ---
let openai;
if (!openAIKey) {
    console.error("FATAL ERROR: OPENAI_API_KEY is not defined in the server's .env file.");
    console.error("The server cannot function without the OpenAI API key.");
    // Optionally exit if the key is absolutely critical for all functions
    // process.exit(1); 
    // Or allow server to start but endpoints needing the key will fail
} else {
    openai = new OpenAI({ apiKey: openAIKey }); // Initialize client only if key exists
}


// ========================================================
//   EXISTING Reminder Email Endpoint (/api/generate-reminders)
// ========================================================
app.post('/api/generate-reminders', async (req, res) => {
    console.log("Received request for /api/generate-reminders");
    // --- UPDATED: Receive rsvpDeadlineDate from request body ---
    const { guests, facts, rsvpDeadlineDate } = req.body; // Extract deadline date

    // --- Check if OpenAI client was initialized ---
    if (!openai) {
        console.error("OpenAI client not initialized because API key is missing.");
        return res.status(500).json({ error: 'Server configuration error: OpenAI client not available.' });
    }
    
    if (!Array.isArray(guests) || guests.length === 0) {
        return res.status(400).json({ error: 'Invalid input: guests array is required.' });
    }
    console.log(`Generating reminders for ${guests.length} guests.`);
    if (rsvpDeadlineDate) {
        console.log(`Using RSVP Deadline: ${rsvpDeadlineDate}`);
    } else {
        console.log(`RSVP Deadline not provided by frontend.`);
    }

    try {
        const results = {};
        for (const guest of guests) {
            const guestFacts = facts && facts[guest.id] ? facts[guest.id] : "Hope you're doing well!";

            // --- UPDATED: Conditionally set the deadline text for the prompt ---
            const deadlineText = rsvpDeadlineDate
                ? `Mention the need to RSVP by ${rsvpDeadlineDate}.`
                : "Mention the need to RSVP by the deadline specified in their invitation."; // Fallback text

            // --- UPDATED: Prompt uses deadlineText ---
            const prompt = `
            Write a short, friendly, and personalized wedding RSVP reminder email for ${guest.name}.
            Context:
            - This is a reminder because they haven't RSVP'd yet.
            - The wedding is for ${senderNames}.
            - ${deadlineText}
            - Keep the tone warm and excited.
            - Refer to the guest by their first name (${guest.name.split(' ')[0]}).
            - Incorporate the following personal note or fact about the guest: "${guestFacts}"
            - Include a placeholder like "[Link to RSVP - if applicable]".
            - Sign off warmly from "${senderNames}".
            - Start the output directly with the subject line formatted as "Subject: Your Subject Here".
            - Do not include any introductory text like "Here is the email:" just provide the email content starting with "Subject:".
            - Keep it concise, around 100-150 words.
            `;

            try {
                const completion = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo", // Or your preferred model
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.7,
                    max_tokens: 250,
                });
                
                const generatedText = completion.choices[0]?.message?.content?.trim();
                if (generatedText) { 
                    results[guest.id] = generatedText; 
                    console.log(`OK (Reminder): ${guest.name}`); 
                } else { 
                    results[guest.id] = "Error: Could not generate text."; 
                    console.error(`FAIL (Reminder - Empty): ${guest.name}`); 
                }
            } catch (error) { 
                console.error(`FAIL (Reminder - API Error for ${guest.name}):`, error.response ? error.response.data : error.message); 
                results[guest.id] = "Error: Failed to generate reminder."; 
            }
        }
        res.json(results);

    } catch (error) { 
        console.error("Error in /api/generate-reminders main block:", error);
        res.status(500).json({ error: 'An internal server error occurred during reminder generation.' }); 
    }
});


// ========================================================
//   NEW Chatbot Endpoint (/api/chat)
// ========================================================
app.post('/api/chat', async (req, res) => {
    console.log("Received request for /api/chat");
    const { messages } = req.body; // Get message history from frontend request

    // --- Check if OpenAI client was initialized ---
    if (!openai) {
        console.error("OpenAI client not initialized because API key is missing.");
        return res.status(500).json({ error: 'Server configuration error: OpenAI client not available.' });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
         console.error("No valid messages array received from frontend.");
        return res.status(400).json({ error: 'No messages provided in the request.' });
    }

    try {
        console.log(`Sending ${messages.length} messages to OpenAI...`);
        // Using axios here as shown in the previous example, but you could adapt to use the openai SDK directly like in the reminders endpoint if preferred.
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4', // Or your desired model like gpt-3.5-turbo
            messages: messages, // Pass the history received from frontend
            temperature: 0.7,
            max_tokens: 1000 
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openAIKey}` // Use the key securely from server env
            }
        });

        console.log("Received response from OpenAI chat completion.");
        
        // Send only the necessary part of the response back to the frontend
        if (response.data && response.data.choices && response.data.choices.length > 0) {
             const replyContent = response.data.choices[0].message.content;
             res.json({ reply: replyContent }); // Send back in the expected format { reply: "..." }
        } else {
             console.error("Unexpected response structure from OpenAI:", response.data);
             res.status(500).json({ error: 'Received unexpected response structure from OpenAI.' });
        }

    } catch (error) {
        console.error('Error calling OpenAI API for chat:', error.response ? error.response.data : error.message);
        // Send a more informative error back to the frontend
        const errorMsg = error.response?.data?.error?.message || error.message || "Unknown error";
        const statusCode = error.response?.status || 500;
        res.status(statusCode).json({ 
            error: `Error communicating with OpenAI: ${errorMsg}` 
        });
    }
});


// --- Start Server ---
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  if (!openAIKey) {
       console.warn("------------------------------------------------------------");
       console.warn("WARNING: OPENAI_API_KEY is not set in the server's .env file.");
       console.warn("         Chatbot and Reminder features will not function.");
       console.warn("------------------------------------------------------------");
  } else {
       console.log("OpenAI API Key loaded successfully.");
  }
});