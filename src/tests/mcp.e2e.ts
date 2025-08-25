import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

async function callRate(client: Client, currency: string, date: string) {
	const result = await client.callTool({ name: "get_cnb_fx_rate", arguments: { currency, date } });
	const content = (result as any).content as Array<{ type: string; text?: string }> | undefined;
	assert(Array.isArray(content) && content.length > 0 && content[0].type === "text", "No text content");
	const text = content[0].text as string;
	// Expect dot decimal (e.g., 20.885 or 2.661)
	assert(/^[0-9]+(\.[0-9]+)?$/.test(text), `Unexpected rate format: ${text}`);
	return text;
}

(async () => {
	const transport = new StdioClientTransport({
		command: process.execPath,
		args: ["dist/server.js"],
		cwd: process.cwd(),
		stderr: "pipe",
	});
	const client = new Client({ name: "cnb-fx-mcp-tests", version: "0.1.0" });
	await client.connect(transport);

	// Ensure tool is registered
	const tools = await client.listTools({});
	assert(tools.tools.some(t => t.name === "get_cnb_fx_rate"), "Tool not found");

	const cases: Array<[string, string]> = [
		["USD", "13.08.2025"],
		["EUR", "13.08.2025"],
		["GBP", "13.08.2025"],
		// Weekend date: should still return Friday's rate
		["USD", "10.08.2025"], // Sunday
		["EUR", "11.08.2025"], // Monday
	];

	for (const [ccy, date] of cases) {
		const rate = await callRate(client as any, ccy, date);
		// eslint-disable-next-line no-console
		console.log(`${ccy} ${date} => ${rate}`);
	}

	await client.close();
})();
