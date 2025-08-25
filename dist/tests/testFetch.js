import * as cheerio from "cheerio";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
function getRateFromHtml(html, code) {
    const $ = cheerio.load(html);
    const codeUpper = code.toUpperCase();
    let rate = null;
    $("table.currency-table tr").each((_, tr) => {
        const tds = $(tr).find("td");
        if (tds.length >= 5) {
            const c = tds.eq(3).text().trim().toUpperCase();
            if (c === codeUpper) {
                rate = tds.eq(4).text().trim();
                return false;
            }
        }
    });
    if (!rate)
        throw new Error("not found");
    return rate;
}
(() => {
    const date = process.argv[2] || "13.08.2025";
    const code = process.argv[3] || "USD";
    const samplePath = resolve(process.cwd(), "sample-data/index.html");
    const html = readFileSync(samplePath, "utf8");
    const rate = getRateFromHtml(html, code);
    // eslint-disable-next-line no-console
    console.log(`${code} ${date} => ${rate}`);
})();
