import { NextResponse } from "next/server";
import { buildClearAuthCookie } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ data: null });
  res.headers.set("Set-Cookie", buildClearAuthCookie());
  return res;
}
