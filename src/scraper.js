const puppeteer = require("puppeteer");
const { extractProductDescription, processScrapedData } = require("./ai-helper");

/**
 * Scrape eBay product listings
 * @param {string} keyword - Search keyword
 * @param {number} maxPages - Maximum number of pages to scrape (default: 3)
 * @returns {Promise<Array>} - Array of product objects
 */
async function scrapeEbay(keyword, maxPages = 3) {
  console.log(`Starting to scrape eBay for "${keyword}" (up to ${maxPages} pages)...`);
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    // Set user agent to avoid detection
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");

    let allProducts = [];
    let currentPage = 1;

    while (currentPage <= maxPages) {
      const url = `https://www.ebay.com/sch/i.html?_from=R40&_nkw=${encodeURIComponent(keyword)}&_sacat=0&rt=nc&_pgn=${currentPage}`;
      console.log(`Navigating to page ${currentPage}: ${url}`);

      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

      // Wait for search results to load
      await page.waitForSelector(".srp-results .s-item", { timeout: 10000 }).catch(() => {
        console.log("Timeout waiting for search results. Page might have loaded differently.");
      });

      // Check if we have results
      const hasResults = await page.evaluate(() => {
        return document.querySelectorAll(".srp-results .s-item").length > 0;
      });

      if (!hasResults) {
        console.log("No results found on this page or reached the end of results.");
        break;
      }

      // Extract basic product information
      const pageProducts = await page.evaluate(() => {
        const productElements = document.querySelectorAll(".srp-results .s-item");
        // Skip the first element as it's usually a template/ad
        const validProducts = Array.from(productElements).slice(1);

        return validProducts
          .map((product) => {
            const nameElement = product.querySelector(".s-item__title");
            const priceElement = product.querySelector(".s-item__price");
            const linkElement = product.querySelector(".s-item__link");

            return {
              name: nameElement ? nameElement.innerText.trim() : "-",
              price: priceElement ? priceElement.innerText.trim() : "-",
              url: linkElement ? linkElement.href : null,
            };
          })
          .filter((product) => product.url !== null);
      });

      console.log(`Found ${pageProducts.length} products on page ${currentPage}`);

      // Get detailed information for each product
      const detailedProducts = [];
      const detailPage = await browser.newPage();
      await detailPage.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");

      // Process only a subset of products for efficiency (adjust as needed)
      const productsToProcess = pageProducts.slice(0, 5);

      for (const product of productsToProcess) {
        if (!product.url) continue;

        try {
          console.log(`Navigating to product detail: ${product.url}`);
          await detailPage.goto(product.url, { waitUntil: "domcontentloaded", timeout: 30000 });

          // Wait for description tab to load
          await detailPage.waitForSelector("#desc_ifr, .d-item-description, .item-desc", { timeout: 5000 }).catch(() => {
            console.log("Description selector not found, continuing...");
          });

          // Get HTML content for AI processing
          const pageContent = await detailPage.content();

          // Extract description using AI
          const description = await extractProductDescription(pageContent);

          detailedProducts.push({
            ...product,
            description,
          });

          console.log(`Processed product: ${product.name.substring(0, 30)}...`);

          // Be nice to the server with a small delay
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error processing product detail: ${error.message}`);
          detailedProducts.push({
            ...product,
            description: "-",
          });
        }
      }

      await detailPage.close();

      allProducts = [...allProducts, ...detailedProducts];

      // Check if there's a next page
      const hasNextPage = await page.evaluate((currentPage) => {
        const pagination = document.querySelector(".pagination");
        if (!pagination) return false;

        const nextPageLink = pagination.querySelector(`a[aria-label="Next page"]`);
        return !!nextPageLink;
      }, currentPage);

      if (!hasNextPage) {
        console.log("No more pages available.");
        break;
      }

      currentPage++;
    }

    // Process all scraped data with AI
    const processedProducts = await processScrapedData(allProducts);

    return processedProducts;
  } catch (error) {
    console.error("Error during scraping:", error);
    throw error;
  } finally {
    await browser.close();
    console.log("Browser closed.");
  }
}

module.exports = { scrapeEbay };
