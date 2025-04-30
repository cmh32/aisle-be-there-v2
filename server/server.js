// server/server.js - Includes /api/generate-reminders, /api/chat, AND NEW /api/generate-invitation endpoint
require('dotenv').config(); // Load .env variables FIRST
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const axios = require('axios'); // Keep if used by other endpoints like /chat

const app = express();
const port = process.env.PORT || 3001;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

// --- Load Config Info ---
const senderNames = process.env.SENDER_NAMES || "The Happy Couple";
const openAIKey = process.env.OPENAI_API_KEY; // Use this variable consistently

// --- Middleware ---
// app.use(cors({ origin: clientOrigin })); // Temporarily comment out specific origin
app.use(cors()); // Allow all origins for debugging
app.use(express.json()); // To parse JSON request bodies

// --- Initialize OpenAI Client ---
let openai;
if (!openAIKey) {
    console.error("FATAL ERROR: OPENAI_API_KEY is not defined in the server's .env file.");
    console.error("The server cannot function without the OpenAI API key.");
    // process.exit(1); // Optionally exit
} else {
    openai = new OpenAI({ apiKey: openAIKey }); // Initialize client only if key exists
}

// ========================================================
// Helper Function to Build the SVG Prompt
// ========================================================
function buildSvgPrompt(details) {
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

    // Base prompt structure
    return `
Generate ONLY the raw SVG code string for a wedding invitation based on the details and theme below. Output MUST start directly with "<svg" and end with "</svg>". Do NOT include any explanations, comments, or markdown code fences like \`\`\`svg...\`\`\`

**Core Details:**
- Couple's Names: ${coupleNames}
- Wedding Date: ${weddingDate}
- Wedding Time: ${weddingTime}
- Venue Name: ${venueName}
- Venue Address: ${venueAddress}
- RSVP Deadline: ${rsvpDeadline}
- RSVP Method: ${rsvpMethod}
- Additional Info: ${additionalInfo || 'None'}

**SVG Structure & Layout Instructions:**
- Root Element: <svg viewBox="0 0 500 700" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" font-family="[Default Font Based on Theme]"> (Replace [Default Font Based on Theme] with the primary font for the chosen theme, e.g., 'Georgia' for Elegant/Rustic, 'Montserrat' for Modern).
- Grouping: Use <g> elements to group related content (e.g., <g id="names">, <g id="date-time">, <g id="venue">, <g id="rsvp">).
- Text Elements: Use <text> for all content. Apply x, y coordinates for positioning. For centered text, use text-anchor="middle" x="250". Provide adequate vertical spacing between groups (e.g., names y=150-200, date/time y=280-320, venue y=400-440, rsvp y=580-620, additional info y=650 if present).
- Data Placement: Ensure all Core Details above are accurately placed within appropriate <text> elements.
- Content Example: Include standard invitation phrases like "request the pleasure of your company", "at the marriage of", "Reception to follow", etc.

${themeInstructions}

**Final Output Rules:**
- ONLY output the complete, valid SVG string.
- Do not include XML declaration (<?xml...?>).
- Ensure all necessary closing tags are present.
- Use inline styles (style="...") or standard SVG attributes (fill, stroke, font-size, etc.).
    `;
}

// ========================================================
//   EXISTING Reminder Email Endpoint (/api/generate-reminders)
// ========================================================
app.post('/api/generate-reminders', async (req, res) => {
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
//   EXISTING Chatbot Endpoint (/api/chat)
// ========================================================
app.post('/api/chat', async (req, res) => {
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
        // Using the SDK like in the reminders endpoint
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // Or "gpt-3.5-turbo"
            messages: messages, // Pass the history received from frontend
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
//   SVG Invitation Generation Endpoint (/api/generate-invitation)
// ========================================================
app.post('/api/generate-invitation', async (req, res) => {
    console.log(">>> /api/generate-invitation handler START <<<");
    console.log("Received request for /api/generate-invitation");
    if (!openai) {
        console.error("OpenAI client not initialized because API key is missing.");
        return res.status(500).json({ error: 'Server configuration error: OpenAI client not available.' });
    }

    const {
        coupleNames, weddingDate, weddingTime, venueName, venueAddress,
        rsvpDeadline, rsvpMethod, additionalInfo,
        theme, // Expecting theme like "Elegant", "Modern", "Rustic", "Floral", "Minimalist", "Custom"
        styleDescription // Used if theme is "Custom" or if theme is missing
    } = req.body;

    // Basic validation
    if (!coupleNames || !weddingDate || !weddingTime || !venueName || !venueAddress || !rsvpDeadline || !rsvpMethod) {
        return res.status(400).json({ error: 'Missing required invitation details.' });
    }
    if (!theme) {
        console.warn("Theme not explicitly provided, will use default/styleDescription.");
    }

    // --- Construct the Detailed Prompt --- 
    const svgPrompt = buildSvgPrompt(req.body);

    console.log(`Sending SVG generation prompt to OpenAI (Theme: ${theme || 'N/A'})...`);
    // console.log("--- PROMPT START ---"); // DEBUG: Log prompt if needed
    // console.log(svgPrompt);
    // console.log("--- PROMPT END ---");

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4", // Use GPT-4 for better code generation
            messages: [{ role: "user", content: svgPrompt }],
            temperature: 0.5, // Slightly creative but still structured
            max_tokens: 2500, // Allow ample space for SVG code
            // top_p: 1, // Default
            // frequency_penalty: 0, // Default
            // presence_penalty: 0, // Default
        });

        let generatedSvg = completion.choices[0]?.message?.content?.trim();
        const finishReason = completion.choices[0]?.finish_reason;

        // Clean potential markdown fences (handle variations)
        if (generatedSvg) {
            generatedSvg = generatedSvg.replace(/^```(?:svg)?\s*/i, '').replace(/\s*```$/, '');
        }

        // Basic validation + check finish reason
        if (generatedSvg && generatedSvg.startsWith('<svg') && generatedSvg.endsWith('</svg>')) {
            console.log(`Successfully received SVG code from OpenAI. Finish reason: ${finishReason}`);
            if (finishReason === 'length') {
                console.warn("OpenAI response finished due to length, SVG might be truncated.");
                // Optionally append closing tag just in case, though it might break validation if already present
                // generatedSvg += (!generatedSvg.endsWith('</svg>') ? '</svg>' : '');
            }
            // IMPORTANT: In a production environment, SANITIZE the SVG string here before sending to client
            // using a library like DOMPurify configured for SVG to prevent XSS attacks.
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
//   >>> NEW <<< Image Invitation Generation Endpoint (/api/generate-invitation-image)
// ========================================================
app.post('/api/generate-invitation-image', async (req, res) => {
    console.log("Received request for /api/generate-invitation-image");
    if (!openai) {
        console.error("OpenAI client not initialized because API key is missing.");
        return res.status(500).json({ error: 'Server configuration error: OpenAI client not available.' });
    }

    const {
        coupleNames, weddingDate, weddingTime, venueName, venueAddress,
        theme, // Expecting theme like "Elegant", "Modern", "Rustic", "Floral", "Minimalist", "Custom"
        styleDescription // Used if theme is "Custom" or if theme is missing
        // Add other fields if they should influence the visual prompt
    } = req.body;

    // Basic validation
    if (!coupleNames || !theme) {
        return res.status(400).json({ error: 'Missing required details for image generation (couple names, theme).' });
    }

    // --- Construct the Prompt for DALL-E --- \n    // Focus on visual description, less on exact text placement.
    let visualPrompt = `Generate a visually appealing wedding invitation design image. `; 

    // Theme keywords
    switch (theme) {
        case "Elegant":
            visualPrompt += "Style: Elegant and sophisticated. Perhaps include subtle gold or silver accents, classic serif or script fonts for names, clean layout.";
            break;
        case "Modern":
            visualPrompt += "Style: Modern and minimalist. Clean lines, sans-serif fonts, focus on typography and whitespace, maybe a single accent color.";
            break;
        case "Rustic":
            visualPrompt += "Style: Rustic and charming. Earth tones (browns, greens, beige), possibly elements like wood texture, twine, simple leaf motifs, serif fonts.";
            break;
        case "Floral":
            visualPrompt += "Style: Beautiful floral theme. Incorporate illustrated flowers (like roses, peonies, or wildflowers based on description), possibly watercolors, script font for names.";
            break;
        case "Minimalist":
            visualPrompt += "Style: Ultra-minimalist. Primarily black and white, significant whitespace, clean sans-serif font, focus purely on typography and layout.";
            break;
        default: // Custom or default
            if (styleDescription) {
                visualPrompt += `Style described as: \"${styleDescription}\". `; 
            } else {
                visualPrompt += "Use a standard, generally appealing invitation style. ";
            }
    }

    // Add core textual elements (DALL-E may stylize or approximate them)
    visualPrompt += ` Key text to include: the names \"${coupleNames}\" prominently featured. Mention \"Wedding Invitation\". `;
    // Optionally add date/venue if you want the AI to *try* including them visually, but don't rely on accuracy.
    // visualPrompt += ` Mention date: ${weddingDate}. `;

    // Add aspect ratio hint
    visualPrompt += " Aspect ratio should be vertical, approximately 5:7."

    console.log(`Sending Image generation prompt to DALL-E (Theme: ${theme || 'N/A'})...`);
    // console.log("--- VISUAL PROMPT ---");
    // console.log(visualPrompt);
    // console.log("--- END VISUAL PROMPT ---");

    try {
        const response = await openai.images.generate({
            model: "gpt-image-1", // Explicitly using dall-e-3, preferred for quality over dall-e-2
            prompt: visualPrompt,
            n: 1,
            size: "1536x1024", // DALL-E 3 requires size. 1024x1792 is standard vertical (close to 5:7)
            quality: "low",
            // style: "vivid", // Optional: or "natural"
        });

        // Log the *entire* response object for debugging
        console.log("Full OpenAI Image API Response:", JSON.stringify(response, null, 2));

        const imageUrl = response.data?.[0]?.url;

        if (imageUrl) {
            console.log("Successfully received Image URL from OpenAI.");
            res.json({ imageUrl: imageUrl });
        } else {
            console.error("OpenAI response did not contain a valid image URL. Check the full response log above.", response.data); // Log the data part
            // Send more details back for debugging if appropriate, or keep a generic error
            res.status(500).json({ error: "Failed to extract image URL from AI response.", details: response.data }); // Include response data in error
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

// --- Start Server ---
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  if (!openAIKey) {
       console.warn("------------------------------------------------------------");
       console.warn("WARNING: OPENAI_API_KEY is not set in the server's .env file.");
       console.warn("         Chatbot, Reminder, and Invitation features will not function.");
       console.warn("------------------------------------------------------------");
  } else {
       console.log("OpenAI API Key loaded successfully.");
  }
});