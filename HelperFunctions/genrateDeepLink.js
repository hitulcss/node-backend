const fetch = require('node-fetch');
const genrateDeepLink = async (details) => {
  let data = {
    "dynamicLinkInfo": {
      "domainUriPrefix": "https://links.sdcampus.com",
      "link": details.link,//any URL with q data
      "androidInfo": {
        "androidPackageName": "com.sdcampus.app",
      },
      "analyticsInfo": {
        "googlePlayAnalytics": {
          "utmSource": details.utmSource,
          "utmMedium": details.utmMedium,
          "utmCampaign": details.utmCampaign,
          "utmTerm": details.utmTerm,
          "utmContent": details.utmContent
        },

      },
      "socialMetaTagInfo": {
        "socialTitle": details.socialTitle,
        "socialDescription": details.socialDescription,
        "socialImageLink": details.socialImageLink
      }
    },
    "suffix": {
      "option": "SHORT"
    }
  }
  let apiKey = `AIzaSyAw_ZH8bOg7lSRjV_m8y2zhRxC2YacD8as`
  let url = `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${apiKey}`
  const response = await fetch(url, {
    method: "POST",
    headers: {
      'Content-Type': "application/json"
    },
    body: JSON.stringify(data)
  })
  return response.json();

}

module.exports = {
  genrateDeepLink
}