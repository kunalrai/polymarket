import { query, mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

async function requireAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  const user = await ctx.db.get(userId);
  if (user?.email !== process.env.ADMIN_EMAIL) throw new Error("Forbidden");
}

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const markets = await ctx.db.query("markets").collect();
    return markets
      .filter((m) => m.status === "active" && m.end_date > now)
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, 6);
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return (await ctx.db.query("markets").collect()).sort(
      (a, b) => b.end_date - a.end_date
    );
  },
});

export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const markets = await ctx.db.query("markets").collect();
    return markets.find((m) => m._id.toString() === args.id) ?? null;
  },
});

export const searchActive = query({
  args: {
    search: v.optional(v.string()),
    category: v.optional(v.string()),
    sort_by: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let markets = (await ctx.db.query("markets").collect()).filter(
      (m) => m.status === "active"
    );
    if (args.search) {
      const q = args.search.toLowerCase();
      markets = markets.filter((m) => m.title.toLowerCase().includes(q));
    }
    if (args.category && args.category !== "all") {
      markets = args.category === "uncategorized"
        ? markets.filter((m) => !m.category)
        : markets.filter((m) => m.category === args.category);
    }
    if (args.sort_by === "end_date") markets.sort((a, b) => a.end_date - b.end_date);
    else if (args.sort_by === "volume") markets.sort((a, b) => b.volume - a.volume);
    else markets.sort((a, b) => b.created_at - a.created_at);
    return markets;
  },
});

export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const markets = await ctx.db.query("markets").collect();
    return [...new Set(markets.map((m) => m.category).filter(Boolean))];
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    end_date: v.number(),
    price_yes: v.number(),
    price_no: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("markets", {
      ...args,
      is_featured: false,
      status: "active",
      volume: 0,
      created_at: Date.now(),
    });
  },
});

export const createInternal = internalMutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    end_date: v.number(),
    price_yes: v.number(),
    price_no: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("markets", {
      ...args,
      is_featured: false,
      status: "active",
      volume: 0,
      created_at: Date.now(),
    });
  },
});

export const createBtcMarket = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user: any = await ctx.runQuery(internal.users.getById, { id: userId as string });
    if (user?.email !== process.env.ADMIN_EMAIL) throw new Error("Forbidden");

    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
    );
    const data = await response.json();
    const price = data.bitcoin.usd as number;

    const roundedPrice = Math.round(price / 100) * 100;
    const threshold = price < 70000 ? roundedPrice + 2000 : roundedPrice - 2000;
    const trend = price < threshold ? "cross" : "fall below";
    const title = `Will BTC ${trend} $${threshold.toLocaleString()} by June 2025?`;
    const description = `Live market based on current BTC price ($${price.toFixed(2)}) using CoinGecko data.`;
    const priceYes = price < threshold ? 0.58 : 0.35;
    const priceNo = Math.round((1 - priceYes) * 100) / 100;

    await ctx.runMutation(internal.markets.createInternal, {
      title,
      description,
      end_date: new Date("2025-06-30").getTime(),
      price_yes: priceYes,
      price_no: priceNo,
    });

    return { success: true, title };
  },
});
