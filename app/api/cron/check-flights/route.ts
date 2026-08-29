import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runDailyScan } from "@/src/modules/notifications/daily-scan";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secret || !token || secret.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(secret), Buffer.from(token));
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json({ ok: true, ...(await runDailyScan()) }); }
  catch (error) { console.error("Cron failed", error); return NextResponse.json({ ok: false, error: "Flight scan failed" }, { status: 500 }); }
}