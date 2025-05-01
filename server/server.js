// server/server.js - Includes existing endpoints PLUS the new /api/recommend-plus-ones
require('dotenv').config(); // Load .env variables FIRST
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const axios = require('axios'); // Keep as it might be used (though maybe not currently)

// --- NEW: Require the Plus One logic ---
const { PlusOneRecommender } = require('./plusOneLogic');
// --- END NEW ---

const app = express();
const port = process.env.PORT || 3001;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

// --- Load Config Info ---
const senderNames = process.env.SENDER_NAMES || "The Happy Couple";
const openAIKey = process.env.OPENAI_API_KEY; // Use this variable consistently

// --- Middleware ---
app.use(cors()); // Allow all origins for debugging
app.use(express.json({ limit: '10mb' })); // Allow larger request bodies for guest lists etc.

// --- Initialize OpenAI Client ---
let openai;
if (!openAIKey) {
    console.error("FATAL ERROR: OPENAI_API_KEY is not defined in the server's .env file.");
    console.error("The server cannot function without the OpenAI API key.");
} else {
    openai = new OpenAI({ apiKey: openAIKey }); // Initialize client only if key exists
}

// ========================================================
// Helper Function to Build the SVG Prompt (Keep Existing)
// ========================================================
function buildSvgPrompt(details) {
    // ... (Keep the exact SVG prompt builder function code you provided) ...
    const {
        coupleNames, weddingDate, weddingTime, venueName, venueAddress,
        rsvpDeadline, rsvpMethod, additionalInfo, theme, styleDescription
    } = details;

    let themeInstructions = "";

    // Define theme-specific guidelines
    switch (theme) {
        case "Elegant":
            themeInstructions = `
            **Styling (Theme: Elegant):**
            - Typography: Use elegant serif fonts like 'Playfair Display' or 'Georgia' for main text (28-32pt for names, 14-16pt for details, 12-13pt smaller text). A script font like 'Dancing Script' (400 weight) could be used for names. Use font-weight for emphasis. Ensure font families are correctly specified.
            - Colors: Primarily use black (#000000) or dark gray (#333333) for text. Accents in gold (#DAA520), silver (#C0C0C0), or deep burgundy (#800020) can be used sparingly for borders or flourishes.
            - Decorations: Add a sophisticated border using <rect> (e.g., stroke: #DAA520, stroke-width: 1.5). Simple, clean corner flourishes using <path> are acceptable. Avoid overly complex illustrations.
            `;
            break;
        case "Modern":
            themeInstructions = `
            **Styling (Theme: Modern):**
            - Typography: Use clean sans-serif fonts like 'Montserrat', 'Lato', or 'Poppins' (specify weights like 400, 600). Keep font sizes clean and readable (e.g., 24-28pt for names, 13-15pt details, 11-12pt smaller text). Use font-weight (600 or 700) for emphasis.
            - Colors: Use a minimalist palette: black (#000000), white (#FFFFFF), and grays (#666666, #AAAAAA). A single, bold accent color (e.g., a vibrant blue #007bff or teal #20c997) can be used for thin lines or a small graphic element, but keep it minimal.
            - Decorations: Emphasize clean lines. Use thin <line> elements (stroke-width: 0.5 or 1) as dividers. A simple geometric frame using <rect> (thin stroke, no fill) is appropriate. Avoid curves or complex shapes.
            `;
            break;
        case "Rustic":
            themeInstructions = `
            **Styling (Theme: Rustic):**
            - Typography: Use serif fonts like 'Merriweather' or 'Georgia'. A slightly textured or hand-drawn style font for names could work if available (but prioritize standard fonts). Font sizes: 26-30pt names, 14-15pt details, 12pt smaller text.
            - Colors: Use earth tones: browns (#8B4513, #A0522D), dark greens (#556B2F, #8FBC8F), beige (#F5F5DC), cream (#FFF8DC). Use these for text, strokes, or subtle background elements.
            - Decorations: Add a border resembling craft paper using <rect> (e.g., stroke: #8B4513, stroke-width: 2). Simple leaf or branch motifs using <path> in corners or as small dividers are suitable. Keep illustrations simple.
            `;
            break;
        case "Floral":
             themeInstructions = `
            **Styling (Theme: Floral):**
            - Typography: Use a mix of elegant serif ('Georgia', 'Playfair Display') or clean sans-serif ('Lato') with a script font ('Dancing Script') for names. Sizes: 30-36pt script names, 14-15pt details, 12pt smaller text.
            - Colors: Use a palette inspired by flowers: pinks (#FFC0CB, #FF69B4), greens (#90EE90, #2E8B57), lavender (#E6E6FA), perhaps yellow (#FFD700). Use these for decorative elements and potentially text accents.
            - Decorations: Incorporate floral motifs. Use <path> elements to draw simple flowers, vines, or leaves, perhaps framing the text or decorating corners. A watercolor wash effect is difficult in SVG, so focus on clean lines or filled shapes for the floral elements.
            `;
             break;
        case "Minimalist":
             themeInstructions = `
            **Styling (Theme: Minimalist):**
            - Typography: Use a single, clean sans-serif font like 'Lato' or 'Montserrat' (use weights 400 and 600/700). Very limited font size variation (e.g., 20-22pt names, 13-14pt main text, 11pt small text). Focus on whitespace.
            - Colors: Strictly black (#000000) and white (#FFFFFF). Maybe one shade of gray (#CCCCCC) if absolutely necessary.
            - Decorations: Extremely sparse. Maybe no border, or a single very thin hairline <line> divider (stroke-width: 0.5). No illustrations or complex shapes. Layout and typography are key.
            `;
             break;
        default: // If no theme or 'Custom'
            if (styleDescription) {
                themeInstructions = `
                **Styling (Custom Description Provided):**
                - Apply the following style description as best as possible within SVG constraints: "${styleDescription}"
                - Prioritize clarity and standard SVG practices. Use web-safe fonts if specific fonts aren't mentioned.
                `;
            } else {
                themeInstructions = `
                **Styling (Default):**
                - Use a standard, elegant style. Serif font ('Georgia') for body (14pt), slightly larger serif for names (26pt). Black text. Simple single line border.
                `;
            }
    }

    // Base prompt structure (Keep as provided)
    return `
Generate ONLY the raw SVG code string...
... [Rest of the SVG prompt string] ...
    `;
}


// ========================================================
//   EXISTING Reminder Email Endpoint (/api/generate-reminders) - Keep As Is
// ========================================================
app.post('/api/generate-reminders', async (req, res) => {
    // ... (Keep the exact reminder generation code you provided) ...
    console.log("Received request for /api/generate-reminders");
    const { guests, facts, rsvpDeadlineDate } = req.body;

    if (!openai) {
        console.error("OpenAI client not initialized because API key is missing.");
        return res.status(500).json({ error: 'Server configuration error: OpenAI client not available.' });
    }
    if (!Array.isArray(guests) || guests.length === 0) {
        return res.status(400).json({ error: 'Invalid input: guests array is required.' });
    }
    console.log(`Generating reminders for ${guests.length} guests.`);
    if (rsvpDeadlineDate) { console.log(`Using RSVP Deadline: ${rsvpDeadlineDate}`); }
    else { console.log(`RSVP Deadline not provided by frontend.`); }

    try {
        const results = {};
        for (const guest of guests) {
            const guestFacts = facts && facts[guest.id] ? facts[guest.id] : "Hope you're doing well!";
            const deadlineText = rsvpDeadlineDate ? `Mention the need to RSVP by ${rsvpDeadlineDate}.` : "Mention the need to RSVP by the deadline specified in their invitation.";
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
            * Start the output directly with the subject line formatted as "Subject: Your Subject Here".
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
                const generatedText = completion.choices[0]?.message?.content?.trim();
                if (generatedText) { results[guest.id] = generatedText; console.log(`OK (Reminder): ${guest.name}`); }
                else { results[guest.id] = "Error: Could not generate text."; console.error(`FAIL (Reminder - Empty): ${guest.name}`); }
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
//   EXISTING Chatbot Endpoint (/api/chat) - Keep As Is
// ========================================================
app.post('/api/chat', async (req, res) => {
    // ... (Keep the exact chat code you provided) ...
    console.log("Received request for /api/chat");
    const { messages } = req.body;

    if (!openai) {
        console.error("OpenAI client not initialized because API key is missing.");
        return res.status(500).json({ error: 'Server configuration error: OpenAI client not available.' });
    }
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        console.error("No valid messages array received from frontend.");
        return res.status(400).json({ error: 'No messages provided in the request.' });
    }

    try {
        console.log(`Sending ${messages.length} messages to OpenAI chat...`);
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: messages,
            temperature: 0.7,
            max_tokens: 1000
        });

        console.log("Received response from OpenAI chat completion.");
        const replyContent = completion.choices[0]?.message?.content?.trim();

        if (replyContent) {
            res.json({ reply: replyContent });
        } else {
            console.error("Unexpected empty response content from OpenAI.");
            res.status(500).json({ error: 'Received an empty reply from the AI assistant.' });
        }

    } catch (error) {
        console.error('Error calling OpenAI API for chat:', error.response ? error.response.data : error.message);
        const errorMsg = error.response?.data?.error?.message || error.message || "Unknown error";
        const statusCode = error.response?.status || 500;
        res.status(statusCode).json({
            error: `Error communicating with OpenAI: ${errorMsg}`
        });
    }
});


// ========================================================
//   EXISTING SVG Invitation Endpoint (/api/generate-invitation) - Keep As Is
// ========================================================
app.post('/api/generate-invitation', async (req, res) => {
    // ... (Keep the exact SVG invitation code you provided) ...
     console.log(">>> /api/generate-invitation handler START <<<");
    console.log("Received request for /api/generate-invitation");
    if (!openai) {
        console.error("OpenAI client not initialized because API key is missing.");
        return res.status(500).json({ error: 'Server configuration error: OpenAI client not available.' });
    }

    const {
        coupleNames, weddingDate, weddingTime, venueName, venueAddress,
        rsvpDeadline, rsvpMethod, additionalInfo,
        theme,
        styleDescription
    } = req.body;

    if (!coupleNames || !weddingDate || !weddingTime || !venueName || !venueAddress || !rsvpDeadline || !rsvpMethod) {
        return res.status(400).json({ error: 'Missing required invitation details.' });
    }
    if (!theme) {
        console.warn("Theme not explicitly provided, will use default/styleDescription.");
    }

    const svgPrompt = buildSvgPrompt(req.body);

    console.log(`Sending SVG generation prompt to OpenAI (Theme: ${theme || 'N/A'})...`);

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: svgPrompt }],
            temperature: 0.5,
            max_tokens: 2500,
        });

        let generatedSvg = completion.choices[0]?.message?.content?.trim();
        const finishReason = completion.choices[0]?.finish_reason;

        if (generatedSvg) {
            generatedSvg = generatedSvg.replace(/^```(?:svg)?\s*/i, '').replace(/\s*```$/, '');
        }

        if (generatedSvg && generatedSvg.startsWith('<svg') && generatedSvg.endsWith('</svg>')) {
            console.log(`Successfully received SVG code from OpenAI. Finish reason: ${finishReason}`);
            if (finishReason === 'length') {
                console.warn("OpenAI response finished due to length, SVG might be truncated.");
            }
            res.json({ svgString: generatedSvg });
        } else {
            console.error("OpenAI response did not contain valid SVG code after cleanup.");
            console.error("Finish Reason:", finishReason);
            console.error("Received Content Snippet:", generatedSvg ? generatedSvg.substring(0, 200) + "..." : "None");
            const debugInfo = generatedSvg || `No valid content received (Finish Reason: ${finishReason})`;
            res.status(500).json({ error: `Failed to generate valid SVG code from AI. Response snippet: ${debugInfo.substring(0, 150)}...` });
        }

    } catch (error) {
        console.error('Error calling OpenAI API for SVG generation:', error.response ? JSON.stringify(error.response.data) : error.message);
        const errorMsg = error.response?.data?.error?.message || error.message || "Unknown API error";
        const statusCode = error.response?.status || 500;
        res.status(statusCode).json({
            error: `Error communicating with OpenAI for SVG generation: ${errorMsg}`
        });
    }
});


// ========================================================
//   EXISTING Image Invitation Endpoint (/api/generate-invitation-image) - Keep As Is
// ========================================================
app.post('/api/generate-invitation-image', async (req, res) => {
    // ... (Keep the exact image invitation code you provided) ...
    console.log("Received request for /api/generate-invitation-image");
    if (!openai) {
        console.error("OpenAI client not initialized because API key is missing.");
        return res.status(500).json({ error: 'Server configuration error: OpenAI client not available.' });
    }

    const {
        coupleNames, theme, styleDescription // Simplified for brevity
    } = req.body;

    if (!coupleNames || !theme) {
        return res.status(400).json({ error: 'Missing required details for image generation (couple names, theme).' });
    }

    let visualPrompt = `Generate a visually appealing wedding invitation design image. `;
    switch (theme) { /* ... keep switch case ... */
        case "Elegant": visualPrompt += "..."; break;
        case "Modern": visualPrompt += "..."; break;
        case "Rustic": visualPrompt += "..."; break;
        case "Floral": visualPrompt += "..."; break;
        case "Minimalist": visualPrompt += "..."; break;
        default: visualPrompt += (styleDescription ? `Style described as: \"${styleDescription}\". ` : "Use a standard style. ");
    }
    visualPrompt += ` Key text: names \"${coupleNames}\" prominently. Mention \"Wedding Invitation\". `;
    visualPrompt += " Aspect ratio vertical 5:7."

    console.log(`Sending Image generation prompt to DALL-E (Theme: ${theme || 'N/A'})...`);

    try {
        const response = await openai.images.generate({
            model: "dall-e-3", // Use dall-e-3 explicitly
            prompt: visualPrompt,
            n: 1,
            size: "1024x1792", // Correct vertical size for DALL-E 3
            quality: "standard", // Use 'standard' or 'hd'
        });

        console.log("Full OpenAI Image API Response:", JSON.stringify(response, null, 2));
        const imageUrl = response.data?.[0]?.url;

        if (imageUrl) {
            console.log(`Successfully received Image URL from OpenAI: ${imageUrl}`);
            res.json({ imageUrl: imageUrl });
        } else {
            console.error("OpenAI response did not contain a valid image URL.", response.data);
            res.status(500).json({ error: "Failed to extract image URL from AI response.", details: response.data });
        }

    } catch (error) {
        console.error('Error calling OpenAI API for Image generation:', error.response ? JSON.stringify(error.response.data) : error.message);
        const errorMsg = error.response?.data?.error?.message || error.message || "Unknown API error";
        const statusCode = error.response?.status || 500;
        res.status(statusCode).json({
            error: `Error communicating with OpenAI for Image generation: ${errorMsg}`
        });
    }
});


// ========================================================
//   >>> NEW <<< Plus One Recommendation Endpoint (Add This Section)
// ========================================================
app.post('/api/recommend-plus-ones', (req, res) => {
    console.log("Received request for /api/recommend-plus-ones");
    const { guests, max_courtesy_plus_ones } = req.body; // Expect max limit from frontend

    // Basic Input Validation
    if (!Array.isArray(guests)) {
        console.error("Invalid input: guests data is not an array.");
        return res.status(400).json({ error: 'Invalid input: guests array is required.' });
    }
     const maxLimit = parseInt(max_courtesy_plus_ones, 10);
     if (isNaN(maxLimit) || maxLimit < 0) {
         console.warn(`Invalid or missing max_courtesy_plus_ones: ${max_courtesy_plus_ones}. Defaulting to 0.`);
     }

    try {
        // Instantiate the recommender with data from the request body
        const recommender = new PlusOneRecommender(guests, maxLimit || 0); // Pass validated limit
        // Generate the recommendations
        const recommendations = recommender.generateRecommendations(); // Returns the flat list

        console.log(`Generated ${recommendations.length} plus-one recommendations.`);
        // Send the flat list of results back to the frontend
        // Structure: [{ guestId, name, recommendation, reason, score }, ...]
        res.json({ recommendations: recommendations });

    } catch (error) {
        console.error("Error during plus one recommendation generation:", error);
        res.status(500).json({ error: 'An internal server error occurred during recommendation.' });
    }
});
// --- END NEW SECTION ---


// --- Start Server ---
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  if (!openAIKey) {
       console.warn("------------------------------------------------------------");
       console.warn("WARNING: OPENAI_API_KEY is not set in the server's .env file.");
       console.warn("         AI features (Chat, Reminders, Invitations) may not function.");
       console.warn("------------------------------------------------------------");
  } else {
       console.log("OpenAI API Key loaded successfully.");
  }
});