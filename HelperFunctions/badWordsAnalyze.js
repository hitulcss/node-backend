const axios = require('axios');

// Perspective API Configuration
const API_KEY = 'AIzaSyA5lrSCKSz-qN5EtlULHZ02ItIVXqTSfpw'; // Replace with your actual API key
const PERSPECTIVE_API_URL = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${API_KEY}`;

/**
 * Analyze a message for toxicity using Perspective API.
 * @param {string} message - The message to analyze.
 * @returns {Promise<string>} - Clean message or flagged notice.
 */
const moderateMessage = async (message) => {
    try {
        const isToxic = await checkToxicity(message);
        console.log("Toxic:", isToxic);
        return isToxic;  // Directly return the boolean value
    } catch (error) {
        console.error("Moderation Error:", error);
        return false;  // Return false if an error occurs
    }
};

/**
 * Checks the toxicity score of a message.
 * @param {string} message - The message to evaluate.
 * @returns {Promise<boolean>} - True if toxic, otherwise false.
 */
const checkToxicity = async (message) => {
    const requestBody = {
        comment: { text: message },
        languages: ['en', 'hi'],
        requestedAttributes: { TOXICITY: {} }
    };

    const response = await axios.post(PERSPECTIVE_API_URL, requestBody);
    const score = response.data.attributeScores.TOXICITY.summaryScore.value;

    return score > 0.7; // Toxic if score exceeds the threshold
};

module.exports = { moderateMessage };
