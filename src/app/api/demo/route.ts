import { and, count, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { demoRequests } from "@/db/schema";
import { validateDemoSubmission } from "@/lib/demo";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "Please send a JSON inquiry." }, { status: 415 });
  }
  if (Number(request.headers.get("content-length") ?? 0) > 12000) {
    return Response.json({ error: "Your request is too large. Please shorten your message." }, { status: 413 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: "We couldn’t read your request. Please try again." }, { status: 400 }); }
  const result = validateDemoSubmission(body);
  if (!result.valid) return Response.json({ error: result.error }, { status: 400 });

  try {
    const [recent] = await db.select({ total: count() }).from(demoRequests).where(and(eq(demoRequests.email, result.data.email), gte(demoRequests.createdAt, new Date(Date.now() - 60 * 60 * 1000))));
    if (recent.total >= 5) {
      return Response.json({ error: "You’ve already sent us a few requests. Please try again in an hour, or we’ll be in touch using the details you provided." }, { status: 429 });
    }
    const { website: _website, ...inquiry } = result.data;
    const [saved] = await db.insert(demoRequests).values({ ...inquiry, phone: inquiry.phone || null, message: inquiry.message || null }).returning({ id: demoRequests.id });
    return Response.json({ success: true, reference: saved.id.slice(0, 8).toUpperCase() }, { status: 201 });
  } catch (error) {
    console.error("CallBackly inquiry database write failed", { name: error instanceof Error ? error.name : "DatabaseError" });
    return Response.json({ error: "We couldn’t save your request right now. Please try again in a moment." }, { status: 503 });
  }
}
