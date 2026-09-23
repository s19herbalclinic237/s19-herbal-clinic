import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { User } from "@/lib/models/User";
import { Order } from "@/lib/models/Order";
import { Message } from "@/lib/models/Message";

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Users are temporarily unavailable." }, { status: 503 });
  }

  try {
    const users = await User.find({ role: "user" })
      .select("name email phone emailVerified isActive lastLoginAt createdAt familyMembers")
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();

    const ids = users.map((u) => u._id);

    const [orderGroups, messageGroups, replyGroups] = await Promise.all([
      Order.aggregate<{ _id: unknown; count: number }>([
        { $match: { user: { $in: ids } } },
        { $group: { _id: "$user", count: { $sum: 1 } } },
      ]),
      Message.aggregate<{ _id: unknown; count: number }>([
        { $match: { user: { $in: ids }, author: "admin", read: false } },
        { $group: { _id: "$user", count: { $sum: 1 } } },
      ]),
      Message.aggregate<{ _id: unknown; count: number }>([
        { $match: { user: { $in: ids }, author: "user", read: false } },
        { $group: { _id: "$user", count: { $sum: 1 } } },
      ]),
    ]);

    const orderCounts = new Map(orderGroups.map((g) => [String(g._id), g.count]));
    const unreadCounts = new Map(messageGroups.map((g) => [String(g._id), g.count]));
    const replyCounts = new Map(replyGroups.map((g) => [String(g._id), g.count]));

    const result = users.map((u) => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      phone: u.phone ?? "",
      emailVerified: u.emailVerified,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt ?? null,
      createdAt: u.createdAt,
      orderCount: orderCounts.get(String(u._id)) ?? 0,
      unreadCount: unreadCounts.get(String(u._id)) ?? 0,
      replyCount: replyCounts.get(String(u._id)) ?? 0,
      familyMembers: (u.familyMembers || []).map((m: { _id: unknown; name: string; relation?: string }) => ({
        id: String(m._id),
        name: m.name,
        relation: m.relation,
      })),
    }));

    return NextResponse.json({ users: result });
  } catch (error) {
    console.error("[admin/users] list failed:", error);
    return NextResponse.json({ error: "Could not load users." }, { status: 500 });
  }
}