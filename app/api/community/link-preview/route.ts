import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateAuth } from "@/lib/apiAuth";
import crypto from "crypto";

const supabase = supabaseAdmin;

// Helper to create MD5 hash for URL
function hashUrl(url: string): string {
  return crypto.createHash("md5").update(url).digest("hex");
}

// Extract video info from URL
function extractVideoInfo(url: string): { video_url: string | null; video_type: string | null } {
  try {
    const urlObj = new URL(url);

    // YouTube
    if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
      let videoId: string | null = null;

      if (urlObj.hostname.includes("youtu.be")) {
        videoId = urlObj.pathname.slice(1);
      } else {
        videoId = urlObj.searchParams.get("v");
      }

      if (videoId) {
        return {
          video_url: `https://www.youtube.com/embed/${videoId}`,
          video_type: "youtube"
        };
      }
    }

    // Vimeo
    if (urlObj.hostname.includes("vimeo.com")) {
      const match = urlObj.pathname.match(/\/(\d+)/);
      if (match) {
        return {
          video_url: `https://player.vimeo.com/video/${match[1]}`,
          video_type: "vimeo"
        };
      }
    }
  } catch {
    // Invalid URL
  }

  return { video_url: null, video_type: null };
}

// Fetch Open Graph metadata from URL
async function fetchOpenGraphData(url: string): Promise<{
  title: string | null;
  description: string | null;
  image_url: string | null;
  favicon_url: string | null;
  site_name: string | null;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; InterpretOSBot/1.0; +https://interpretos.com)"
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Parse meta tags
    const getMetaContent = (property: string): string | null => {
      // Try og: prefix first
      const ogMatch = html.match(new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']*)["']`, "i")) ||
                      html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:${property}["']`, "i"));
      if (ogMatch) return ogMatch[1];

      // Try twitter: prefix
      const twitterMatch = html.match(new RegExp(`<meta[^>]*name=["']twitter:${property}["'][^>]*content=["']([^"']*)["']`, "i")) ||
                          html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']twitter:${property}["']`, "i"));
      if (twitterMatch) return twitterMatch[1];

      // Try standard meta name
      const nameMatch = html.match(new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, "i")) ||
                       html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${property}["']`, "i"));
      if (nameMatch) return nameMatch[1];

      return null;
    };

    // Get title
    let title = getMetaContent("title");
    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      title = titleMatch ? titleMatch[1].trim() : null;
    }

    // Get description
    const description = getMetaContent("description");

    // Get image
    let imageUrl = getMetaContent("image");
    if (imageUrl && !imageUrl.startsWith("http")) {
      const urlObj = new URL(url);
      imageUrl = new URL(imageUrl, urlObj.origin).href;
    }

    // Get favicon
    let faviconUrl: string | null = null;
    const faviconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']*)["']/i) ||
                        html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["'](?:icon|shortcut icon)["']/i);
    if (faviconMatch) {
      faviconUrl = faviconMatch[1];
      if (!faviconUrl.startsWith("http")) {
        const urlObj = new URL(url);
        faviconUrl = new URL(faviconUrl, urlObj.origin).href;
      }
    } else {
      // Try default favicon location
      const urlObj = new URL(url);
      faviconUrl = `${urlObj.origin}/favicon.ico`;
    }

    // Get site name
    const siteName = getMetaContent("site_name");

    return {
      title: title ? title.slice(0, 200) : null,
      description: description ? description.slice(0, 500) : null,
      image_url: imageUrl,
      favicon_url: faviconUrl,
      site_name: siteName ? siteName.slice(0, 100) : null
    };
  } catch (error) {
    console.error("Error fetching OG data:", error);
    return {
      title: null,
      description: null,
      image_url: null,
      favicon_url: null,
      site_name: null
    };
  }
}

// GET - Fetch or retrieve cached link preview
export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "url parameter is required" },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL" },
        { status: 400 }
      );
    }

    const urlHash = hashUrl(url);

    // Check cache first
    const { data: cached, error: cacheError } = await supabase
      .from("link_previews")
      .select("*")
      .eq("url_hash", urlHash)
      .single();

    if (!cacheError && cached) {
      // Check if cache is still valid (30 days)
      const expiresAt = new Date(cached.expires_at);
      if (expiresAt > new Date() && cached.fetch_status === "success") {
        return NextResponse.json({
          preview: {
            url: cached.url,
            title: cached.title,
            description: cached.description,
            image_url: cached.image_url,
            favicon_url: cached.favicon_url,
            site_name: cached.site_name,
            video_url: cached.video_url,
            video_type: cached.video_type
          },
          cached: true
        });
      }
    }

    // Fetch fresh data
    const videoInfo = extractVideoInfo(url);
    const ogData = await fetchOpenGraphData(url);

    // Calculate expiration (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const previewData = {
      url,
      url_hash: urlHash,
      title: ogData.title,
      description: ogData.description,
      image_url: ogData.image_url,
      favicon_url: ogData.favicon_url,
      site_name: ogData.site_name,
      video_url: videoInfo.video_url,
      video_type: videoInfo.video_type,
      fetch_status: ogData.title ? "success" : "failed",
      fetched_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    };

    // Upsert to cache
    const { error: upsertError } = await supabase
      .from("link_previews")
      .upsert(previewData, {
        onConflict: "url_hash"
      });

    if (upsertError) {
      console.error("Error caching link preview:", upsertError);
      // Don't fail the request, just return the fetched data
    }

    if (!ogData.title && !videoInfo.video_url) {
      return NextResponse.json({
        preview: null,
        cached: false,
        error: "Failed to fetch preview"
      });
    }

    return NextResponse.json({
      preview: {
        url,
        title: ogData.title,
        description: ogData.description,
        image_url: ogData.image_url,
        favicon_url: ogData.favicon_url,
        site_name: ogData.site_name,
        video_url: videoInfo.video_url,
        video_type: videoInfo.video_type
      },
      cached: false
    });

  } catch (error: any) {
    console.error("Link preview fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
