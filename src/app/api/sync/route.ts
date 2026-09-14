import { NextRequest, NextResponse } from "next/server";
import { runSync } from "@/lib/sync";
import { downloadExcelFromSharedLink } from "@/lib/onedrive-share";
import { parseSalesWorkbook } from "@/lib/excel-parser";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const querySecret = request.nextUrl.searchParams.get("secret");
  const headerSecret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  return querySecret === secret || headerSecret === secret;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const shareUrl = process.env.ONEDRIVE_SHARE_URL ?? "";

  const result = await runSync({
    downloadExcel: () => downloadExcelFromSharedLink(shareUrl),
    parseWorkbook: (buffer) => parseSalesWorkbook(buffer),
  });

  return NextResponse.json(result, { status: result.status === "SUCCESS" ? 200 : 500 });
}
