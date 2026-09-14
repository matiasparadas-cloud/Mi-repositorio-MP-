import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboardBreakdown, type BreakdownDimension, type DashboardFilters } from "@/lib/dashboard-query";
import { getCalendarWeekRange } from "@/lib/metrics";

export const dynamic = "force-dynamic";

const VALID_DIMENSIONS: BreakdownDimension[] = ["product", "brand", "category", "salesperson", "zone"];

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const groupBy = searchParams.get("groupBy");

  if (!groupBy || !VALID_DIMENSIONS.includes(groupBy as BreakdownDimension)) {
    return NextResponse.json(
      { error: `groupBy debe ser uno de: ${VALID_DIMENSIONS.join(", ")}` },
      { status: 400 }
    );
  }

  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  let from: Date;
  let to: Date;

  if (!fromParam && !toParam) {
    const currentWeek = getCalendarWeekRange(new Date());
    from = currentWeek.start;
    to = currentWeek.end;
  } else {
    const parsedFrom = fromParam ? new Date(fromParam) : null;
    const parsedTo = toParam ? new Date(toParam) : null;

    if (!parsedFrom || !parsedTo || Number.isNaN(parsedFrom.getTime()) || Number.isNaN(parsedTo.getTime())) {
      return NextResponse.json({ error: "Los parámetros from/to deben ser fechas válidas" }, { status: 400 });
    }
    from = parsedFrom;
    to = parsedTo;
  }

  const filters: DashboardFilters = {
    from,
    to,
    productId: searchParams.get("productId") ?? undefined,
    brand: searchParams.get("brand") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    salespersonId: searchParams.get("salespersonId") ?? undefined,
    zoneId: searchParams.get("zoneId") ?? undefined,
  };

  const rows = await getDashboardBreakdown(filters, groupBy as BreakdownDimension);

  return NextResponse.json(rows);
}
