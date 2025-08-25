I need to make a simple MCP server that will fetch a fx rate for a given currency on a given date.

Input: Currency code (3 letter), date
Output: FX rate
Process:
- turn the input currency to uppercase
- fetch https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/index.html?date=13.08.2025 page for a given day (date format is dd.mm.yyyy)
- locate a table and find a rate - see @index.html for a sample of received page
- return the rate or error if not found

Great, document it into README.md, then do a  code review and fix the issues