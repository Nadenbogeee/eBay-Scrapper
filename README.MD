# eBay Product Scraper API with AI Integration

This API scrapes product listings from eBay search results using Puppeteer for web scraping and AI integration for extracting product descriptions and processing data.

## Features

* Search eBay products by keyword
* Extract product name, price, and description
* Navigate through multiple pages of search results
* Use AI (OpenAI or Deepseek) to extract product descriptions
* Return results in JSON format
* Handle missing values gracefully

## Prerequisites

* Node.js (v14 or later)
* npm or yarn
* API key for OpenAI or Deepseek

## Installation

1. Clone the repository:

```
git clone https://github.com/yourusername/ebay-scraper.git
cd ebay-scraper
```

2. Install dependencies:

```
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```
OPENAI_API_KEY=your_openai_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key (optional)
PORT=3000
```

## Usage

1. Start the API server:

```
npm start
```

2. Access the API endpoints:

* `GET /api/products?keyword=nike&pages=3`
  * `keyword`: Search term (required)
  * `pages`: Maximum number of pages to scrape (optional, default: 3, max: 10)

## API Response Format

```json
{
  "keyword": "nike",
  "pagesScraped": 3,
  "totalProducts": 15,
  "products": [
    {
      "name": "Nike Men's Air Max 90 Shoes",
      "price": "$120.00",
      "description": "Brand new Nike Air Max 90 shoes for men. Available in multiple sizes and colors.",
      "url": "https://www.ebay.com/itm/..."
    },
    {
      "name": "Nike Women's Running Shorts",
      "price": "$24.99",
      "description": "Comfortable running shorts with Dri-FIT technology.",
      "url": "https://www.ebay.com/itm/..."
    }
    // More products...
  ]
}
```

## Technical Implementation Details

### Web Scraping

* Uses Puppeteer to handle JavaScript-rendered content
* Navigates through pagination to collect all products
* Visits individual product pages to extract detailed descriptions

### AI Integration

* Uses OpenAI or Deepseek API to extract product descriptions from HTML content
* Processes and cleans scraped data
* Handles edge cases and missing values

### Error Handling

* Gracefully handles timeouts and failed requests
* Returns appropriate HTTP status codes for different error scenarios
* Provides detailed error messages for debugging

## Limitations

* eBay may change their website structure, requiring updates to the selectors
* Rate limiting may be applied by eBay for frequent requests
* The API is configured to process only a subset of products per page for efficiency

## License

MIT

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
