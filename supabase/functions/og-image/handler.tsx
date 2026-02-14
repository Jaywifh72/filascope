import React from "https://esm.sh/react@18.2.0";
import { ImageResponse } from "https://deno.land/x/og_edge@0.0.6/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + "\u2026";
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "default";
    const title = truncate(url.searchParams.get("title") || "FilaScope", 60);
    const subtitle = url.searchParams.get("subtitle") || "";
    const price = url.searchParams.get("price") || "";
    const accentColor = url.searchParams.get("color") || "#00d4aa";
    const imageUrl = url.searchParams.get("image") || "";

    // Fetch product image if provided
    let imageSrc: string | null = null;
    if (imageUrl) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 3000);
        const imgRes = await fetch(imageUrl, { signal: ctrl.signal });
        clearTimeout(timer);
        if (imgRes.ok) {
          const buf = await imgRes.arrayBuffer();
          const bytes = new Uint8Array(buf);
          let binary = "";
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          imageSrc = `data:image/png;base64,${btoa(binary)}`;
        }
      } catch {
        // Skip image on failure
      }
    }

    const hasImage = imageSrc !== null;
    const h = React.createElement;

    const children: React.ReactNode[] = [
      // Top accent bar
      h("div", {
        style: {
          display: "flex", position: "absolute",
          top: 0, left: 0, right: 0, height: "4px",
          background: `linear-gradient(90deg, ${accentColor}, #00d4aa, ${accentColor})`,
        },
      }),
      // Bottom glow
      h("div", {
        style: {
          display: "flex", position: "absolute",
          bottom: 0, left: 0, width: "600px", height: "200px",
          background: `radial-gradient(ellipse at bottom left, ${accentColor}15, transparent 70%)`,
        },
      }),
    ];

    // Logo badge
    const badge = (type === "product" || type === "brand")
      ? h("span", {
          style: {
            fontSize: "14px", color: "#00d4aa", marginLeft: "8px",
            padding: "2px 10px", border: "1px solid #00d4aa40", borderRadius: "12px",
          },
        }, type === "product" ? "FILAMENT" : "BRAND")
      : null;

    const logoRow = h("div", {
      style: { display: "flex", alignItems: "center", gap: "12px" },
    },
      h("div", {
        style: {
          display: "flex", width: "36px", height: "36px", borderRadius: "8px",
          backgroundColor: "#00d4aa", alignItems: "center", justifyContent: "center",
          fontSize: "20px", fontWeight: 700, color: "#0a0e17",
        },
      }, "F"),
      h("span", {
        style: { fontSize: "24px", fontWeight: 600, color: "#ffffff", letterSpacing: "-0.5px" },
      }, "FilaScope"),
      badge,
    );

    // Main content elements
    const mainChildren: React.ReactNode[] = [
      h("div", {
        style: {
          fontSize: title.length > 40 ? "36px" : "44px",
          fontWeight: 700, color: "#ffffff", lineHeight: 1.15, letterSpacing: "-1px",
        },
      }, title),
    ];

    if (subtitle) {
      const subtitleChildren: React.ReactNode[] = [];
      if (type === "product" && accentColor !== "#00d4aa") {
        subtitleChildren.push(h("div", {
          style: {
            display: "flex", width: "16px", height: "16px", borderRadius: "50%",
            backgroundColor: accentColor, border: "2px solid #ffffff30",
          },
        }));
      }
      subtitleChildren.push(h("span", {
        style: { fontSize: "22px", color: "#00d4aa", fontWeight: 500 },
      }, subtitle));
      mainChildren.push(h("div", {
        style: { display: "flex", alignItems: "center", gap: "12px" },
      }, ...subtitleChildren));
    }

    if (price) {
      mainChildren.push(h("div", {
        style: { display: "flex", alignItems: "center", gap: "8px" },
      }, h("span", {
        style: { fontSize: "28px", fontWeight: 700, color: "#00d4aa" },
      }, price)));
    }

    const mainContent = h("div", {
      style: { display: "flex", flexDirection: "column", gap: "16px" },
    }, ...mainChildren);

    const footer = h("div", {
      style: { display: "flex", alignItems: "center", fontSize: "15px", color: "#8892b0" },
    }, "filascope.com \u2014 Compare 3D printing filaments");

    // Text column
    children.push(h("div", {
      style: {
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "48px 56px", width: hasImage ? "720px" : "1100px", height: "100%",
      },
    }, logoRow, mainContent, footer));

    // Product image
    if (hasImage && imageSrc) {
      children.push(h("div", {
        style: {
          display: "flex", position: "absolute",
          right: "40px", top: "115px",
          width: "400px", height: "400px",
          alignItems: "center", justifyContent: "center",
        },
      }, h("img", {
        src: imageSrc, width: 380, height: 380,
        style: { objectFit: "contain", borderRadius: "16px" },
      })));
    }

    const element = h("div", {
      style: {
        display: "flex", width: "1200px", height: "630px",
        backgroundColor: "#0a0e17", position: "relative", overflow: "hidden",
      },
    }, ...children);

    return new ImageResponse(element, {
      width: 1200,
      height: 630,
      headers: {
        ...corsHeaders,
        "Cache-Control": "public, max-age=604800, s-maxage=604800",
        "CDN-Cache-Control": "public, max-age=604800",
      },
    });
  } catch (err) {
    console.error("OG image generation error:", err);
    return new Response(JSON.stringify({ error: "Failed to generate image" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
