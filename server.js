const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');

const app = express();
const port = 3000;

let browser;

// Function to initialize the browser instance
async function initializeBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({ headless: true });
  }
  return browser;
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/scrape', async (req, res) => {
  const url = req.query.url;

  try {
    const browserInstance = await initializeBrowser();
    const page = await browserInstance.newPage();
    await page.goto(url);
    await page.waitForSelector('.container .mybox .txtnav', { visible: true });
    const fontElement = await page.$('.container .mybox .txtnav');
    const content = await page.evaluate(element => element.innerText, fontElement);

    const [prevContent, nextContent] = await page.evaluate(() => {
      const page1Div = document.querySelector('.page1');
      const links = Array.from(page1Div.querySelectorAll('a'));
  
      // Extract href attributes of the first and last <a> elements
      const firstHref = links[0].getAttribute('href');
      const lastHref = links[links.length - 1].getAttribute('href');
  
      return [firstHref, lastHref];
    });

    const scrapedData = {
      content,
      prevContent,
      nextContent,
    };

    res.send(scrapedData);
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).send(`An error occurred while scraping the content: ${error.message}`);
  } finally {
    // Don't close the browser here; keep it open for future requests.
  }
});

app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html', 'css'] }));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
