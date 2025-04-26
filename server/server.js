// server/server.js - Updated to use RSVP Deadline Date
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
const port = process.env.PORT || 3001;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

// --- Load Config Info ---
const senderNames = process.env.SENDER_NAMES || "The Happy Couple";
// REMOVED: rsvpDate here, as it comes from the frontend request now

app.use(cors({ origin: clientOrigin }));
app.use(express.json());

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) { /* ... API key check ... */ process.exit(1); }
const openai = new OpenAI({ apiKey: apiKey });

// --- API Endpoint ---
app.post('/api/generate-reminders', async (req, res) => {
  // --- UPDATED: Receive rsvpDeadlineDate from request body ---
  const { guests, facts, rsvpDeadlineDate } = req.body; // Extract deadline date

  if (!Array.isArray(guests) || guests.length === 0) {
    return res.status(400).json({ error: 'Invalid input: guests array is required.' });
  }
  console.log(`Received request for ${guests.length} guests.`);
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
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 250,
        });
        // ... (rest of OpenAI call handling unchanged) ...
        const generatedText = completion.choices[0]?.message?.content?.trim();
           if (generatedText) { results[guest.id] = generatedText; console.log(`OK: ${guest.name}`); }
           else { results[guest.id] = "Error: Could not generate text."; console.error(`FAIL (Empty): ${guest.name}`); }
      } catch (error) { /* ... error handling unchanged ... */ console.error(`FAIL (API): ${guest.name}`); results[guest.id] = "Error: Failed to generate reminder."; }
    }
    res.json(results);

  } catch (error) { /* ... error handling unchanged ... */ res.status(500).json({ error: 'An internal server error occurred.' }); }
});

// --- Start Server ---
app.listen(port, () => { /* ... unchanged ... */ });