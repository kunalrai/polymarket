import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    password_hash: v.string(),
  }).index("by_email", ["email"]),

  markets: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    end_date: v.number(), // unix ms
    is_featured: v.boolean(),
    status: v.string(), // "active" | "resolved"
    outcome: v.optional(v.string()), // "yes" | "no"
    price_yes: v.number(),
    price_no: v.number(),
    volume: v.number(),
    created_at: v.number(), // unix ms
  }),

  trades: defineTable({
    user_id: v.string(),
    market_id: v.string(), // markets._id as string
    share_type: v.string(), // "yes" | "no"
    amount: v.number(),
    price_at_trade: v.number(),
    created_at: v.number(), // unix ms
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

  password_reset_tokens: defineTable({
    email: v.string(),
    token: v.string(),
    expires_at: v.number(),
  }).index("by_token", ["token"]),
});
