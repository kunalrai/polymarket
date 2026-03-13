import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const create = mutation({
  args: { email: v.string(), password_hash: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing) {
      throw new Error("User already registered");
    }
    return await ctx.db.insert("users", {
      email: args.email,
      password_hash: args.password_hash,
    });
  },
});

export const updatePassword = mutation({
  args: { email: v.string(), password_hash: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, { password_hash: args.password_hash });
  },
});

export const createResetToken = mutation({
  args: { email: v.string(), token: v.string(), expires_at: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("password_reset_tokens", {
      email: args.email,
      token: args.token,
      expires_at: args.expires_at,
    });
  },
});

export const getResetToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("password_reset_tokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
  },
});

export const deleteResetToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("password_reset_tokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (record) await ctx.db.delete(record._id);
  },
});
