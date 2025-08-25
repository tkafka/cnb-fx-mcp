### CNB FX MCP Server

Fetches FX rates from the Czech National Bank (ČNB) for a given currency and date by scraping the daily rates page. See the official page: [Kurzy devizového trhu – ČNB](https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/).

Paste this into your MCP config (adjust the absolute path):
```json
"cnb-fx": {
  "command": "node",
  "args": [
    "/absolute/path/to/cnb-fx-mcp/dist/index.js"
  ],
  "cwd": "/absolute/path/to/cnb-fx-mcp"
}
```

# For developers

### Requirements

- Node.js 18+ (Node 20+ recommended)
- pnpm 8+

### Install

```bash
pnpm install
```

### Build

```bash
pnpm run build
```

- Outputs `dist/index.js` and compiled test artifacts.

### Run (stdio MCP server)

- Development (watch):
```bash
pnpm run dev
```
- Production (built):
```bash
pnpm start
```

This server speaks MCP over stdio. Any MCP client that supports stdio can launch it with:
- **Command**: `node`
- **Args**: `dist/index.js`
- **CWD**: project root

### Tool contract

- **Tool name**: `get_cnb_fx_rate`
- **Description**: Fetch CNB FX rate (CZK) for a currency on a date
- **Args**:
  - `currency` (string): three-letter code (e.g., `USD`, case-insensitive)
  - `date` (string): `dd.mm.yyyy` or `yyyy-mm-dd`
- **Returns**: `text` content with the rate using dot decimal. Example: `20.885`.
- **Errors**:
  - HTTP failures (e.g., `HTTP 4xx/5xx`)
  - Missing table (`Rates table not found`)
  - Missing currency for date (`Currency XXX not found for dd.mm.yyyy`)

Notes:
- ČNB rates are valid for the working day and the following weekend/holidays. Weekend inputs will return the most recent published working-day rate.
- Output is normalized to dot decimal.

### Tests

End-to-end tests use the MCP client SDK to spawn the server and call the tool for multiple currencies and dates (including a weekend):

```bash
pnpm run test:mcp
```

Sample output:
```bash
USD 13.08.2025 => 20.885
EUR 13.08.2025 => 24.470
GBP 13.08.2025 => 28.350
USD 10.08.2025 => 20.993
EUR 11.08.2025 => 24.485
```

A lightweight HTML parsing check also exists (uses the provided sample HTML):
```bash
pnpm run test:fetch
```

### Programmatic MCP usage (LLMs & tools)

- Launch via stdio:
  - **command**: `node`
  - **args**: `dist/index.js`
  - **cwd**: repository root
- After initialization, call:
  - `tools/list` → verify `get_cnb_fx_rate`
  - `tools/call` with `{ name: "get_cnb_fx_rate", arguments: { currency: "USD", date: "13.08.2025" } }`
- Expected result content:
  - `[{ type: "text", text: "20.885" }]`

If your client supports static server config, point it to the above command and args and it will connect over stdio automatically.

### Deployment

- Build: `pnpm run build`
- Distribute the built files from `dist/`
- Run with: `node dist/index.js`

No additional configuration is required. The server fetches the official CNB HTML page directly.

### Troubleshooting

- If the server can’t find the table, verify the CNB page structure hasn’t changed.
- Network blocks can be mitigated by retrying; the server already sends common browser headers to avoid simple blocks.
- Weekend/holiday dates are expected to resolve to the nearest published working-day rate per CNB policy.

### Project scripts

- **build**: TypeScript build → `dist/`
- **dev**: watch mode for local development
- **start**: run built server over stdio
- **test:mcp**: end-to-end MCP tests via stdio client
- **test:fetch**: parse sample HTML (`sample-data/index.html`)

### License

See project terms or your repository license.
