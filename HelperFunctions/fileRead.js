const https = require('https');
const fetchData = (url) => {
    return new Promise((resolve, reject) => {
      let data = '';
  
      https.get(url, (response) => {
        response.on('data', (chunk) => {
          data += chunk;
        });
  
        response.on('end', () => {
          const wordArray = data.match(/\b\w+\b/g) || [];
          resolve(wordArray);
        });
      }).on('error', (error) => {
        reject(`Error: ${error.message}`);
      });
    });
  };

module.exports = {
    fetchData
}