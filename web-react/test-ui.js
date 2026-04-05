const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('http://localhost:3000/pie-slang/pie-playground/');

    // Wait for the UI to load
    await page.waitForTimeout(2000);

    // We are evaluating inside the browser context
    const nodes = await page.evaluate(() => {
        // We can't access Zustand directly from window unless we exposed it.
        // Let's try to find DOM elements with class .react-flow__node-lemma
        const lemmaElements = document.querySelectorAll('.react-flow__node-lemma');
        return Array.from(lemmaElements).map(el => {
            const parent = el; // .react-flow__node
            return {
                id: parent.getAttribute('data-id'),
                transform: parent.style.transform
            };
        });
    });

    console.log("Found Lemma Nodes in DOM:", nodes);

    await browser.close();
})();
