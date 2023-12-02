const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');

const app = express();
const port = 3000;

let browser;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/scrape', async (req, res) => {
  const url = req.query.url;

  try {
    if (!browser) {
      browser = await puppeteer.launch({ headless: true });
    }

    const page = await browser.newPage();
    await page.goto(url);

    if (url.includes('69shuba.com')) {
      await page.waitForSelector('.container .mybox .txtnav');
      const contentElement = await page.$('.container .mybox .txtnav .hide720');
      const content = await page.evaluate(element => element.innerText, contentElement);

      //const prevElement = await page.$('.container .mybox .page1:first-child');
      //const prevContent = await page.evaluate(element => element.getAttribute('href'), prevElement);

      //const nextElement = await page.$('.container .mybox .page1:last-child');
      //const nextContent = await page.evaluate(element => element.getAttribute('href'), nextElement);

      const prevContent = 'test';
      const nextContent = 'test2';

      const scrapedData = {
        content,
        prevContent,
        nextContent
      };

      res.send(scrapedData);
    } else { // booktoki
      await page.waitForSelector('.content .at-content #at-wrap #at-main .view-wrap section #novel_content');
      const contentElement = await page.$('.content .at-content #at-wrap #at-main .view-wrap section #novel_content');
      const content = await page.evaluate(element => element.innerText, contentElement);

      const prevElement = await page.$('#goPrevBtn');
      const prevContent2 = await page.evaluate(element => element.getAttribute('href'), prevElement);
      const prevContent = prevContent2.split('?')[0];

      const nextElement = await page.$('#goNextBtn');
      const nextContent2 = await page.evaluate(element => element.getAttribute('href'), nextElement);
      const nextContent = nextContent2.split('?')[0];

      const scrapedData = {
        content,
        prevContent,
        nextContent
      };

      res.send(scrapedData);
    }
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).send(`An error occurred while scraping the content: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
      browser = null;
    }
  }
});

app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html', 'css'] }));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});