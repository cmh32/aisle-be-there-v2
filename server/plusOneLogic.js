// server/plusOneLogic.js - UPDATED (Removed Partner Status Logic)

/**
 * Logic for recommending plus-ones based on guest attributes and settings.
 */

// Constants for recommendation types/reasons - REMOVED YES_PARTNER
const RecStatus = {
    YES_SERIOUS_REL: { status: 'Yes', reason: 'Serious Relationship' },
    YES_CLOSE_TIES: { status: 'Yes', reason: 'Close Family/Friend' },
    // YES_PARTNER removed as it's covered by YES_SERIOUS_REL
    YES_PARTY: { status: 'Yes', reason: 'Wedding Party' },
    YES_COURTESY: { status: 'Yes', reason: 'Courtesy (+1)' },
    NO_LOW_PRIORITY: { status: 'No', reason: 'Lower Priority' },
    NO_LIMIT_REACHED: { status: 'No', reason: 'Limit Reached' }
};

// Mapping from frontend relationshipCloseness to internal categories (Unchanged)
function getRelationshipCategory(closeness) {
    // ... (no changes needed in this function) ...
    const lowerCloseness = closeness?.toLowerCase() || 'other';
    if (lowerCloseness.includes('immediate family')) return 'immediate_family';
    if (lowerCloseness.includes('best friend') || lowerCloseness.includes('close friend')) return 'close_friend';
    if (lowerCloseness.includes('extended family') || lowerCloseness.includes('distant relative')) return 'extended_family';
    if (lowerCloseness.includes('friend') || lowerCloseness.includes('friend of partner')) return 'friend';
    if (lowerCloseness.includes('coworker')) return 'coworker';
    return 'other';
}

// Weights for sorting courtesy candidates (Unchanged)
const courtesyPriorityWeights = { /* ... */ };


class PlusOneRecommender {
    constructor(guests, maxCourtesyPlusOnes = 10) {
        this.guests = guests || [];
        this.maxCourtesyPlusOnes = parseInt(maxCourtesyPlusOnes, 10) || 0;
        // console.log(`Recommender initialized. Max Courtesy +1s: ${this.maxCourtesyPlusOnes}`);
    }

    /**
     * Determines the initial recommendation category for a guest before applying limits.
     * REMOVED the check for guest.partner_status
     * @param {object} guest - Guest object including `is_serious_relationship`, `relationshipCloseness`, etc.
     * @returns {object} - Recommendation status object
     */
    _getInitialRecommendation(guest) {
        // Rule 0: Explicit Serious Relationship flag
        if (guest.is_serious_relationship) {
            return RecStatus.YES_SERIOUS_REL;
        }

        // Rule 0.5: Immediate Family / Close Friend
        const category = getRelationshipCategory(guest.relationshipCloseness);
        if (category === 'immediate_family' || category === 'close_friend') {
            return RecStatus.YES_CLOSE_TIES;
        }

        // *** REMOVED Partner Status Check ***
        // const establishedPartner = ['Married', 'Engaged', 'In Relationship'].includes(guest.partner_status);
        // if (establishedPartner) return RecStatus.YES_PARTNER;

        // Rule 2: Wedding Party
        if (guest.is_wedding_party) {
            return RecStatus.YES_PARTY;
        }

        // Rule 3: Potential Courtesy +1
        const needsComfort = !(guest.knows_many_others ?? true);
        const isTraveling = guest.is_out_of_town ?? false;

        if (needsComfort || isTraveling) {
            const priority = courtesyPriorityWeights[category] ?? 0;
            const extraBoost = (needsComfort && isTraveling) ? 0.5 : 0;
            let courtesyReason = [];
            if (needsComfort) courtesyReason.push("Doesn't Know Others");
            if (isTraveling) courtesyReason.push("Out of Town");
            return {
                status: 'Courtesy Candidate',
                priority: priority + extraBoost,
                reasonDetails: courtesyReason.join(' & ')
             };
        }

        // Rule 4: Default to No (Low Priority)
        return RecStatus.NO_LOW_PRIORITY;
    }

    /**
     * Generates the final list of recommendations, applying limits. (Unchanged)
     * @returns {Array<object>} - List of recommendation objects
     */
    generateRecommendations() {
        // ... (This function remains the same as before) ...
        const results = [];
        const courtesyCandidates = [];

        this.guests.forEach(guest => {
            if (!guest || !guest.id) return;
            const initialRec = this._getInitialRecommendation(guest); // Uses updated logic

            if (initialRec.status === 'Yes' || initialRec.status === 'No') {
                results.push({ guestId: guest.id, name: guest.name, recommendation: initialRec.status, reason: initialRec.reason, score: initialRec.status === 'Yes' ? 100 : (initialRec.priority ?? 0) });
            } else if (initialRec.status === 'Courtesy Candidate') {
                courtesyCandidates.push({ guestId: guest.id, name: guest.name, priority: initialRec.priority, reasonDetails: initialRec.reasonDetails });
            }
        });

        courtesyCandidates.sort((a, b) => b.priority - a.priority);

        let courtesySlotsUsed = 0;
        courtesyCandidates.forEach(candidate => {
            let finalStatus, finalReason;
            if (courtesySlotsUsed < this.maxCourtesyPlusOnes) {
                finalStatus = RecStatus.YES_COURTESY.status;
                finalReason = candidate.reasonDetails ? `Courtesy (${candidate.reasonDetails})` : RecStatus.YES_COURTESY.reason;
                courtesySlotsUsed++;
            } else {
                finalStatus = RecStatus.NO_LIMIT_REACHED.status;
                finalReason = RecStatus.NO_LIMIT_REACHED.reason;
            }
             results.push({ guestId: candidate.guestId, name: candidate.name, recommendation: finalStatus, reason: finalReason, score: candidate.priority });
        });

        return results;
    }
}

module.exports = { PlusOneRecommender };