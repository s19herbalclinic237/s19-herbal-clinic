import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Google Drive "Anyone with the link" reviews can't be hot-linked into a
 * <video> element: Drive's media endpoint answers with `Content-Disposition:
 * attachment`, and Chromium refuses to play a response it treats as a
 * download (MEDIA_ELEMENT_ERROR "Format error", nothing buffers).
 *
 * This route proxies the stream on our own origin so the response is a plain
 * video/mp4 with Range support and no attachment disposition. It transfers
 * the Range/Content-Length/Content-Range headers straight from Drive.
 */
const DRIVE_ID_RE = /^[\w-]{16,64}$/;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;
  if (!DRIVE_ID_RE.test(fileId)) {
    return new Response("Invalid video.", { status: 400 });
  }

  const upstream = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(
    fileId
  )}&export=download&confirm=t`;
  const range = request.headers.get("range");

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstream, {
      headers: {
        // Send a browser-ish UA + Accept so Drive streams the raw file.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        Accept: "video/mp4,video/*;q=0.9,*/*;q=0.8",
        ...(range ? { Range: range } : {}),
      },
      redirect: "follow",
    });
  } catch {
    return new Response("Video source unavailable.", { status: 502 });
  }

  const contentType = upstreamRes.headers.get("content-type") || "video/mp4";

  // Private files / virus-consent pages come back as HTML (or non-2xx).
  if (!upstreamRes.ok || contentType.toLowerCase().includes("text/html")) {
    await upstreamRes.body?.cancel().catch(() => undefined);
    return new Response("Video source unavailable.", { status: 502 });
  }

  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set("Accept-Ranges", "bytes");

  const contentLength = upstreamRes.headers.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);
  const contentRange = upstreamRes.headers.get("content-range");
  if (contentRange) headers.set("Content-Range", contentRange);

  // Deliberately do NOT forward Content-Disposition: attachment.

  return new Response(upstreamRes.body, {
    status: upstreamRes.status === 206 ? 206 : 200,
    headers,
  });
}