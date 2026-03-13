import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  markets: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    end_date: v.number(),
    is_featured: v.boolean(),
    status: v.string(),
    outcome: v.optional(v.string()),
    price_yes: v.number(),
    price_no: v.number(),
    volume: v.number(),
    created_at: v.number(),
  }),

  trades: defineTable({
    user_id: v.string(),
    market_id: v.string(),
    share_type: v.string(),
    amount: v.number(),
    price_at_trade: v.number(),
    created_at: v.number(),
  }).index("by_market", ["market_id"]),

  market_prices: defineTable({
    market_id: v.string(),
    timestamp: v.number(),
    price_yes: v.number(),
    price_no: v.number(),
  }).index("by_market", ["market_id"]),

  holdings: defineTable({
    user_id: v.string(),
    market_id: v.string(),
    share_type: v.string(),
    quantity: v.number(),
  }).index("by_user_market", ["user_id", "market_id"]),

  market_resolution_logs: defineTable({
    market_id: v.string(),
    resolved_by: v.string(),
    outcome: v.string(),
    resolved_at: v.number(),
  }),
});
