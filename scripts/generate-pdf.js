const playwright = require("C:/nvm4w/nodejs/node_modules/playwright");
const path = require("path");

(async () => {
  const htmlFile = process.argv[2];
  const pdfFile = process.argv[3];
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  await page.goto(`file://${path.resolve(htmlFile)}`, { waitUntil: "networkidle" });
  await page.pdf({
    path: pdfFile,
    format: "A4",
    printBackground: true,
    margin: { top: "2cm", bottom: "2cm", left: "2.5cm", right: "2.5cm" }
  });
  await browser.close();
  console.log(`PDF generated: ${pdfFile}`);
})();
