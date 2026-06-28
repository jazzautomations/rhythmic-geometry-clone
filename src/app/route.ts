import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

// Always read from disk — no cache. In dev this lets us edit the HTML
// and see changes without restarting the server.
export const dynamic = "force-dynamic";

async function getHtml(): Promise<string> {
  const htmlPath = join(process.cwd(), "public", "index-original.html");
  return await readFile(htmlPath, "utf8");
}

export async function GET() {
  const html = await getHtml();
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
