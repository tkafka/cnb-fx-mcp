import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { fetch } from "undici";
import * as cheerio from "cheerio";

function toDdMmYyyy(dateStr: string): string {
	// Accepts dd.mm.yyyy already, or yyyy-mm-dd; normalize to dd.mm.yyyy
	if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) return dateStr;
	if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
		const [y, m, d] = dateStr.split("-");
		return `${d}.${m}.${y}`;
	}
	throw new Error("Invalid date format. Use dd.mm.yyyy or yyyy-mm-dd.");
}

async function fetchRateFromHtml(currencyCode: string, dateStr: string): Promise<string> {
	const upper = currencyCode.toUpperCase();
	const dateParam = toDdMmYyyy(dateStr);
	const url = `https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/index.html?date=${encodeURIComponent(dateParam)}`;
	const res = await fetch(url, {
		redirect: "follow",
		headers: {
			"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
			"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
			"Accept-Language": "cs,en;q=0.9",
		},
	});
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const html = await res.text();
	const $ = cheerio.load(html);

	// Locate the currency table rows
	const rows = $("table.currency-table tbody tr");
	if (!rows || rows.length === 0) throw new Error("Rates table not found");

	let found: string | null = null;
	rows.each((_, el) => {
		const tds = $(el).find("td");
		if (tds.length >= 5) {
			const code = $(tds[3]).text().replace(/\u00a0/g, " ").trim().toUpperCase();
			if (code === upper) {
				const rateText = $(tds[4]).text().trim();
				// Normalize: remove spaces/NBSP, convert decimal comma to dot
				const compact = rateText.replace(/[\u00a0\s]/g, "");
				found = compact.replace(",", ".");
				return false; // break
			}
		}
	});

	if (!found) throw new Error(`Currency ${upper} not found for ${dateParam}`);
	return found;
}

const server = new McpServer({ name: "cnb-fx", version: "0.1.0" });

type GetFxArgs = { currency: string; date: string };

server.registerTool(
	"get_cnb_fx_rate",
	{
		description: "Fetch CNB FX rate (CZK) for a currency on a date (dd.mm.yyyy)",
		inputSchema: {
			currency: z.string(),
			date: z.string(),
		},
	},
	async ({ currency, date }: GetFxArgs) => {
		const rate = await fetchRateFromHtml(currency, date);
		return {
			content: [
				{ type: "text", text: rate },
			],
		};
	}
);

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	// eslint-disable-next-line no-console
	console.log("cnb-fx MCP server running (stdio)");
}

main().catch((err) => {
	// eslint-disable-next-line no-console
	console.error(err);
	process.exit(1);
});
