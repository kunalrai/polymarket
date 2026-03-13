import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByMarket = query({
  args: { market_id: v.string() },
  handler: async (ctx, args) => {
    const trades = await ctx.db
      .query("trades")
      .withIndex("by_market", (q) => q.eq("market_id", args.market_id))
      .collect();
    return trades.sort((a, b) => b.created_at - a.created_at);
  },
});

export const create = mutation({
  args: {
    user_id: v.string(),
    market_id: v.string(),
    share_type: v.string(),
    amount: v.number(),
    price_at_trade: v.number(),
  },
  handler: async (ctx, args) => {
    const tradeId = await ctx.db.insert("trades", {
      ...args,
      created_at: Date.now(),
    });

    // Update market volume
    const market = await ctx.db
      .query("markets")
      .collect()
      .then((ms) => ms.find((m) => m._id.toString() === args.market_id));
    if (market) {
      await ctx.db.patch(market._id, { volume: market.volume + args.amount });
    }

    // Update holdings
    const holdings = await ctx.db
      .query("holdings")
      .withIndex("by_user_market", (q) =>
        q.eq("user_id", args.user_id).eq("market_id", args.market_id)
      )
      .collect();

    const existing = holdings.find((h) => h.share_type === args.share_type);
    if (existing) {
      await ctx.db.patch(existing._id, {
        quantity: existing.quantity + args.amount,
      });
    } else {
      await ctx.db.insert("holdings", {
        user_id: args.user_id,
        market_id: args.market_id,
        share_type: args.share_type,
        quantity: args.amount,
      });
    }

    return tradeId;
  },
});
