// const { fetchData } = require("./fileRead");
const axios = require('axios');
// const badWords = require('../utils/badWords');

// Perspective API Configuration
const API_KEY = 'AIzaSyA5lrSCKSz-qN5EtlULHZ02ItIVXqTSfpw'; // Replace with your actual API key
const PERSPECTIVE_API_URL = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${API_KEY}`;

/**
 * Checks the toxicity score of a message.
 * @param {string} message - The message to evaluate.
 * @returns {Promise<boolean>} - True if toxic, otherwise false.
 */
const checkToxicity = async (message) => {

        // const badWordRegex = new RegExp(`\\b(${badWords.join('|')})\\b`, 'i'); // used for profanity filtering only

    //     function escapeRegex(word) {
    //         return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    //     }
    //     const escapedBadWords = badWords.map(escapeRegex);
    //     const badWordRegex = new RegExp(`\\b(${escapedBadWords.join('|')})\\b`, 'i');
    //     function containsBadWords(text) {
    //         return badWordRegex.test(text);
    //     }
        
      
      
    //   if (containsBadWords(message)) {
    //     console.log("⚠️ Inappropriate content detected.",message);
    //   } else {
    //     console.log("✅ Content is clean.");
    //   }
    //   return true
    const requestBody = {
        comment: { text: message },
        languages: ['en', 'hi'],
        requestedAttributes: { requestedAttributes: { TOXICITY: {}, INSULT: {}, PROFANITY: {}, THREAT: {} } }
    };

    const response = await axios.post(PERSPECTIVE_API_URL, requestBody);
    const score = response.data.attributeScores.TOXICITY.summaryScore.value;

    return score > 0.7; // Toxic if score exceeds the threshold
};

const badWordCheck = async (message) => {
    // console.log( typeof msg)
    // let url = `https://d1mbj426mo5twu.cloudfront.net/assets/feed/output.txt`
    // const wordArray = await fetchData(url);
    // const wordsToRemove = [
    //     "I", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them",
    //     "mine", "yours", "his", "hers", "ours", "theirs", "myself", "yourself", "himself", "herself", "itself", "ourselves", "yourselves", "themselves",
    //     "this", "that", "these", "those", "who", "whom", "whose", "which", "what", "anyone", "someone", "everyone", "nobody", "none", "all", "some", "few", "many", "any", "several",
    //     "each other", "one another", "beautiful", "bright", "happy", "dark", "strong", "gentle", "loud", "some", "many", "few", "several", "all", "enough", "none",
    //     "this", "that", "these", "those", "my", "your", "his", "her", "its", "our", "their", "which", "what", "whose",
    //     "bigger", "better", "faster", "more interesting",
    //     "biggest", "best", "fastest", "most interesting",
    //     "quickly", "slowly", "easily", "carefully", "beautifully",
    //     "now", "then", "yesterday", "soon", "today", "tomorrow", "lately",
    //     "here", "there", "everywhere", "nowhere", "up", "down", "inside", "outside",
    //     "always", "often", "sometimes", "rarely", "never", "usually",
    //     "very", "too", "quite", "almost", "enough", "so", "extremely",
    //     "how", "when", "where", "why"
    // ];
    // const filteredMsg = msg.replace(new RegExp(`\\b(${wordsToRemove.join('|')})\\b`, 'gi'), '').trim();
    // if (wordArray.some((item) => new RegExp(`\\b${item?.toLowerCase()}\\b`, 'i').test(filteredMsg?.toLowerCase()))) {
    //     return true;
    // }
    // return false;

    try {
        const isToxic = await checkToxicity(message);
        console.log("Toxic:", isToxic);
        return isToxic;  // Directly return the boolean value
    } catch (error) {
        console.error("Moderation Error:", error);
        return false;  // Return false if an error occurs
    }

}

module.exports = {
    badWordCheck
}