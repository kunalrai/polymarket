#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const CONVEX_URL = process.env.CONVEX_URL || "https://sensible-minnow-186.convex.cloud";
const MCP_SECRET = process.env.MCP_SECRET || "polymarket-mcp-secret-2024";

async function callConvex(fnName, args) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: fnName, args }),
  });
  const data = await res.json();
  if (!res.ok || data.status === "error") {
    throw new Error(data.errorMessage || data.message || "Convex error");
  }
  return data.value;
}

async function callConvexQuery(fnName, args) {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: fnName, args }),
  });
  const data = await res.json();
  if (!res.ok || data.status === "error") {
    throw new Error(data.errorMessage || data.message || "Convex error");
  }
  return data.value;
}

const server = new McpServer({
  name: "polymarket",
  version: "1.0.0",
});

server.tool(
  "create_market",
  "Create a new prediction market",
  {
    title: z.string().describe("Market question, e.g. 'Will ETH exceed $5000 by Dec 2025?'"),
    description: z.string().optional().describe("Additional context for the market"),
    category: z.string().optional().describe("Category: Crypto, Politics, Sports, Technology, Entertainment"),
    end_date: z.string().describe("Closing date in ISO format, e.g. '2025-12-31'"),
    price_yes: z.number().min(0.01).max(0.99).describe("Initial YES price (0.01–0.99), e.g. 0.60 means 60% probability"),
    price_no: z.number().min(0.01).max(0.99).optional().describe("Initial NO price — defaults to 1 - price_yes"),
  },
  async ({ title, description, category, end_date, price_yes, price_no }) => {
    const priceYes = price_yes;
    const priceNo = price_no ?? Math.round((1 - priceYes) * 100) / 100;
    const endDateMs = new Date(end_date).getTime();
    if (isNaN(endDateMs)) {
      return { content: [{ type: "text", text: `Invalid end_date: ${end_date}` }], isError: true };
    }

    try {
      const id = await callConvex("markets:createMcp", {
        secret: MCP_SECRET,
        title,
        description,
        category,
        end_date: endDateMs,
        price_yes: priceYes,
        price_no: priceNo,
      });
      return {
        content: [{
          type: "text",
          text: `Market created!\n\nID: ${id}\nTitle: ${title}\nYes: ${priceYes} (${Math.round(priceYes * 100)}%)\nNo: ${priceNo} (${Math.round(priceNo * 100)}%)\nCloses: ${new Date(endDateMs).toLocaleDateString()}\n\nView at: http://localhost:5173/market/${id}`,
        }],
      };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
    }
  }
);

server.tool(
  "list_markets",
  "List all prediction markets",
  {},
  async () => {
    try {
      const markets = await callConvexQuery("markets:getAll", {});
      if (!markets || markets.length === 0) {
        return { content: [{ type: "text", text: "No markets found." }] };
      }
      const lines = markets.map(m =>
        `• [${m.status}] ${m.title}\n  ID: ${m._id} | Yes: ${m.price_yes} | Volume: ${m.volume} | Closes: ${new Date(m.end_date).toLocaleDateString()}`
      ).join("\n\n");
      return { content: [{ type: "text", text: `${markets.length} markets:\n\n${lines}` }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
