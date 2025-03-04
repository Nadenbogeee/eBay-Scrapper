const express = require("express");
const cors = require("cors");
const { scrapeEbay } = require("./scraper");
require("dotenv").config();

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Apply middleware
app.use(cors());
app.use(express.json());

// Define routes
app.get("/", (req, res) => {
  res.json({
    message: "eBay Scraper API",
    endpoints: {
      "/api/products": "GET - Search products with query parameter: keyword",
    },
  });
});

app.get("/api/products", async (req, res) => {
  try {
    const keyword = req.query.keyword;
    const maxPages = parseInt(req.query.pages, 10) || 3;

    if (!keyword) {
      return res.status(400).json({ error: "Missing required parameter: keyword" });
    }

    // Validate maxPages
    if (maxPages < 1 || maxPages > 10) {
      return res.status(400).json({ error: "Pages parameter must be between 1 and 10" });
    }

    console.log(`Received request to scrape products for keyword: ${keyword}, pages: ${maxPages}`);

    const products = await scrapeEbay(keyword, maxPages);

    res.json({
      keyword,
      pagesScraped: maxPages,
      totalProducts: products.length,
      products,
    });
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: "An error occurred while scraping products", message: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`eBay Scraper API is running on port ${port}`);
});
