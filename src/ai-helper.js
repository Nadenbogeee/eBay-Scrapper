// Import necessary libraries
const { OpenAI } = require("openai");
const axios = require("axios");
require("dotenv").config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Alternative: Use Deepseek if API key is available
const useDeepseek = process.env.DEEPSEEK_API_KEY ? true : false;

/**
 * Extract product description using AI
 * @param {string} htmlContent - HTML content of the product detail page
 * @returns {Promise<string>} - Extracted product description
 */
async function extractProductDescription(htmlContent) {
  try {
    if (useDeepseek) {
      return await extractWithDeepseek(htmlContent);
    } else {
      if (!process.env.OPENAI_API_KEY) {
        console.log("No AI API key provided. Using fallback extraction method.");
        return extractWithRegex(htmlContent);
      }
      return await extractWithOpenAI(htmlContent);
    }
  } catch (error) {
    console.error("Error using AI to extract description:", error);
    return extractWithRegex(htmlContent);
  }
}

/**
 * Extract product description using regex as fallback
 * @param {string} htmlContent - HTML content of the product detail page
 * @returns {string} - Extracted product description or default value
 */
function extractWithRegex(htmlContent) {
  try {
    // Look for common description patterns in eBay pages
    const patterns = [/<div id="ds_div"[^>]*>([\s\S]*?)<\/div>/i, /<div class="item-description"[^>]*>([\s\S]*?)<\/div>/i, /<div class="section"[^>]*>([\s\S]*?)<\/div>/i, /<div class="prod-description"[^>]*>([\s\S]*?)<\/div>/i];

    for (const pattern of patterns) {
      const match = htmlContent.match(pattern);
      if (match && match[1]) {
        // Clean up HTML tags
        const cleanText = match[1]
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        if (cleanText.length > 10) {
          // Arbitrary minimum length
          return cleanText;
        }
      }
    }

    return "-";
  } catch (error) {
    console.error("Error extracting with regex:", error);
    return "-";
  }
}

/**
 * Extract product description using OpenAI
 * @param {string} htmlContent - HTML content of the product detail page
 * @returns {Promise<string>} - Extracted product description
 */
async function extractWithOpenAI(htmlContent) {
  // We'll send a portion of the HTML to avoid token limits
  const truncatedHtml = htmlContent.substring(0, 15000);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a web scraping assistant. Extract the main product description from the HTML content of an eBay product page. Return ONLY the description text, nothing else.",
        },
        {
          role: "user",
          content: `Extract the product description from this eBay product page HTML: ${truncatedHtml}`,
        },
      ],
      max_tokens: 500,
    });

    return response.choices[0].message.content.trim() || "-";
  } catch (error) {
    console.error("OpenAI API error:", error);
    return extractWithRegex(htmlContent); // Fallback to regex
  }
}

/**
 * Extract product description using Deepseek API
 * @param {string} htmlContent - HTML content of the product detail page
 * @returns {Promise<string>} - Extracted product description
 */
async function extractWithDeepseek(htmlContent) {
  // Truncate HTML to avoid token limits
  const truncatedHtml = htmlContent.substring(0, 15000);

  try {
    const response = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a web scraping assistant. Extract the main product description from the HTML content of an eBay product page. Return ONLY the description text, nothing else.",
          },
          {
            role: "user",
            content: `Extract the product description from this eBay product page HTML: ${truncatedHtml}`,
          },
        ],
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Adjust this based on Deepseek's actual response structure
    return response.data.choices[0].message.content.trim() || "-";
  } catch (error) {
    console.error("Deepseek API error:", error);
    return extractWithRegex(htmlContent); // Fallback to regex
  }
}

/**
 * Clean and process scraped data using AI
 * @param {Array} products - Array of product objects
 * @returns {Promise<Array>} - Cleaned and processed product data
 */
async function processScrapedData(products) {
  // For basic processing, we'll just ensure consistent formatting
  // For more complex processing, we could use AI here as well
  return products.map((product) => ({
    ...product,
    name: product.name || "-",
    price: product.price || "-",
    description: product.description || "-",
  }));
}

module.exports = {
  extractProductDescription,
  processScrapedData,
};
