const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5175');
  await new Promise(r => setTimeout(r, 2000));
  const html = await page.content();
  console.log('HTML length:', html.length);
  console.log('HTML body content:', await page.$eval('body', el => el.innerHTML));
  await browser.close();
})();
