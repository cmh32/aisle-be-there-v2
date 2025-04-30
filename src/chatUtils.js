// src/chatUtils.js

// Calculate wedding context from various app state pieces
export const generateWeddingContext = ({
    guests,
    formattedWeddingDate,
    countdownDays,
    rsvpDeadlineDate,
    expenses,
    allottedBudget,
    vendors,
    timelineEvents
}) => {
    const totalGuests = guests?.length || 0;
    const confirmedGuests = guests?.filter(g => g.rsvpStatus === 'Confirmed').length || 0;
    const pendingGuests = guests?.filter(g => g.rsvpStatus === 'Pending').length || 0;
    const declinedGuests = guests?.filter(g => g.rsvpStatus === 'Declined').length || 0;

    const totalSpent = expenses?.reduce((total, expense) =>
        total + (Number(expense.actualCost) || Number(expense.estimatedCost) || 0), 0) || 0;
    const remainingBudget = (Number(allottedBudget) || 0) - totalSpent;

    const vendorCount = vendors?.length || 0;
    const vendorsWithContracts = vendors?.filter(v => v.contractStatus === 'Signed').length || 0;

    const upcomingEvents = timelineEvents?.filter(event => {
        if (!event?.date) return false;
        try {
            const eventDate = new Date(event.date);
            return !isNaN(eventDate.getTime()) && eventDate > new Date();
        } catch(e) {
            console.warn("Could not parse timeline event date:", event.date);
            return false;
        }
    }).length || 0;

    return {
        weddingDate: formattedWeddingDate || "Not set",
        daysUntilWedding: countdownDays ?? "N/A",
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

// Create the system prompt message for the AI
export const createSystemPrompt = (weddingContext) => {
    return {
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
}; 