import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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
    return await ctx.db
      .query("markets")
      .collect()
      .then((ms) => ms.sort((a, b) => b.end_date - a.end_date));
  },
});

export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("markets")
      .collect()
      .then((ms) => ms.find((m) => m._id.toString() === args.id) ?? null);
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
    return await ctx.db.insert("markets", {
      ...args,
      is_featured: false,
      status: "active",
      volume: 0,
      created_at: Date.now(),
    });
  },
});

export const searchActive = query({
  args: {
    search: v.optional(v.string()),
    category: v.optional(v.string()),
    sort_by: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let markets = await ctx.db.query("markets").collect();
    markets = markets.filter((m) => m.status === "active");

    if (args.search) {
      const q = args.search.toLowerCase();
      markets = markets.filter((m) => m.title.toLowerCase().includes(q));
    }

    if (args.category && args.category !== "all") {
      if (args.category === "uncategorized") {
        markets = markets.filter((m) => !m.category);
      } else {
        markets = markets.filter((m) => m.category === args.category);
      }
    }

    if (args.sort_by === "end_date") {
      markets.sort((a, b) => a.end_date - b.end_date);
    } else if (args.sort_by === "volume") {
      markets.sort((a, b) => b.volume - a.volume);
    } else {
      markets.sort((a, b) => b.created_at - a.created_at);
    }

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
