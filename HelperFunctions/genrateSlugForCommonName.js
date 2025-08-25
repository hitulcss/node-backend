const translate = require('translate-google');
const { generateSlug } = require('./generateSlug');
const generateSlugForCommonName = async (inputString) => {
  let response = await translate(inputString, { from: "hi", to: "en" });
  let slug = await generateSlug(response);
  return slug;
}

module.exports = {
  generateSlugForCommonName
}
