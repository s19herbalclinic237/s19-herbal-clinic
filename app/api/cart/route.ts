import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-server";
import { Cart, type ICartItem } from "@/lib/models/Cart";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to sync your cart." }, { status: 401 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ items: [] });
  }

  try {
    const cart = await Cart.findOne({ user: user.id }).lean();
    return NextResponse.json({ items: cart?.items || [] });
  } catch (error) {
    console.error("[cart] get failed:", error);
    return NextResponse.json({ items: [] });
  }
}

function cleanItems(input: unknown): ICartItem[] | null {
  if (!Array.isArray(input)) return null;
  const items: ICartItem[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    const item = raw as { slug?: string; name?: string; price?: number; quantity?: number; image?: string };
    const slug = typeof item?.slug === "string" ? item.slug.trim().slice(0, 200) : "";
    const name = typeof item?.name === "string" ? item.name.trim().slice(0, 200) : "";
    const price = Number(item?.price);
    const quantity = Number(item?.quantity);
    if (!slug || !name || seen.has(slug) || !Number.isFinite(price) || price < 0 || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return null;
    }
    seen.add(slug);
    items.push({
      slug,
      name,
      price,
      quantity,
      image: typeof item?.image === "string" ? item.image.slice(0, 1000) : undefined,
    });
  }
  return items;
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to save your cart." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const rawBody = (body ?? {}) as { items?: unknown };
  const items = cleanItems(rawBody.items);
  if (!items) {
    return NextResponse.json({ error: "Your cart contents could not be validated." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Cart sync is temporarily unavailable." }, { status: 503 });
  }

  try {
    await Cart.updateOne({ user: user.id }, { $set: { items } }, { upsert: true }).exec();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[cart] put failed:", error);
    return NextResponse.json({ error: "Could not save your cart." }, { status: 500 });
  }
}

export async function DELETE() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to clear your cart." }, { status: 401 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Cart sync is temporarily unavailable." }, { status: 503 });
  }

  try {
    await Cart.deleteOne({ user: user.id }).exec();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[cart] delete failed:", error);
    return NextResponse.json({ error: "Could not clear your cart." }, { status: 500 });
  }
}