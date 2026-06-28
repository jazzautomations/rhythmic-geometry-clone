import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-static";

let cachedHtml: string | null = null;

async function getHtml(): Promise<string> {
  if (cachedHtml) return cachedHtml;
  const htmlPath = join(process.cwd(), "public", "index-original.html");
  cachedHtml = await readFile(htmlPath, "utf8");
  return cachedHtml;
}

export async function GET() {
  const html = await getHtml();
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
