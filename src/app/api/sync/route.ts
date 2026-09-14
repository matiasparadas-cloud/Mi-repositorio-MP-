import { NextRequest, NextResponse } from "next/server";
import { runSync } from "@/lib/sync";
import { downloadExcelFromOneDrive } from "@/lib/graph-client";
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

  const config = {
    tenantId: process.env.MS_TENANT_ID ?? "",
    clientId: process.env.MS_CLIENT_ID ?? "",
    clientSecret: process.env.MS_CLIENT_SECRET ?? "",
    driveId: process.env.MS_DRIVE_ID ?? "",
    itemId: process.env.MS_EXCEL_ITEM_ID ?? "",
  };

  const result = await runSync({
    downloadExcel: () => downloadExcelFromOneDrive(config),
    parseWorkbook: (buffer) => parseSalesWorkbook(buffer),
  });

  return NextResponse.json(result, { status: result.status === "SUCCESS" ? 200 : 500 });
}
