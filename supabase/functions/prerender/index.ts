import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CRAWLER_AGENTS = [
  "googlebot","bingbot","slurp","duckduckbot","yandex","baiduspider","applebot","petalbot",
  "bytespider","archive.org_bot","msnbot","sogou","exabot","seznambot",
  "googlebot-image","googlebot-news","googlebot-video","google-inspectiontool","storebot-google",
  "apis-google","adsbot-google","mediapartners-google",
  "twitterbot","facebookexternalhit","linkedinbot","slackbot","discordbot","telegrambot",
  "whatsappbot","ia_archiver","semrushbot","ahrefsbot",
  "gptbot","chatgpt-user","claudebot","anthropic-ai","perplexitybot","google-extended",
  "applebot-extended","ccbot","amazonbot","cohere-ai","diffbot","youbot",
];

const BASE_URL = "https://filascope.com";

/** Normalize a printer slug: lowercase, spaces to hyphens, strip non-alphanumeric, collapse hyphens */
function normSlug(s:string):string{return s.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"").replace(/-{2,}/g,"-").replace(/^-|-$/g,"");}
function buildPrinterIlikePattern(slug:string):string{return `%${normSlug(slug).replace(/-/g,"%")}%`;}
const FUNCTIONS_URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1`;

function buildOgImageUrl(p: { type: string; title: string; subtitle?: string; price?: string; image?: string }): string {
  const url = new URL(`${FUNCTIONS_URL}/og-image`);
  url.searchParams.set("type", p.type);
  url.searchParams.set("title", p.title.slice(0, 60));
  if (p.subtitle) url.searchParams.set("subtitle", p.subtitle.slice(0, 80));
  if (p.price) url.searchParams.set("price", p.price);
  if (p.image) url.searchParams.set("image", p.image);
  return url.toString();
}

// ── Types ──
interface PageData {
  type: string; title: string; description: string; canonical: string;
  ogImage?: string; ogType: string; jsonLd: Record<string, unknown>[];
  breadcrumbs: { name: string; url: string }[];
  h1: string; bodyText: string; modifiedTime?: string;
  links?: { href: string; text: string }[];
  paginationPrev?: string; paginationNext?: string;
}

// ── HTML ──
function esc(s: string) { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }

function buildHtml(d: PageData): string {
  const cu = `${BASE_URL}${d.canonical}`;
  const oi = d.ogImage || `${BASE_URL}/og-image.png`;
  const jld = d.jsonLd.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("\n    ");
  const bc = d.breadcrumbs.map((b,i) => i===d.breadcrumbs.length-1 ? `<span>${esc(b.name)}</span>` : `<a href="${esc(b.url)}">${esc(b.name)}</a>`).join(" › ");
  const pl = [d.paginationPrev ? `<link rel="prev" href="${esc(d.paginationPrev)}" />` : "", d.paginationNext ? `<link rel="next" href="${esc(d.paginationNext)}" />` : ""].filter(Boolean).join("\n    ");
  const bl = d.links?.length ? `<ul aria-label="Filament listing">\n${d.links.map(l=>`<li><a href="${esc(l.href)}">${esc(l.text)}</a></li>`).join("\n")}\n</ul>` : "";
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${esc(d.title)}</title><meta name="description" content="${esc(d.description)}"/><meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"/><link rel="canonical" href="${esc(cu)}"/><meta http-equiv="refresh" content="0;url=${esc(cu)}"/>${pl}<meta property="og:title" content="${esc(d.title)}"/><meta property="og:description" content="${esc(d.description)}"/><meta property="og:url" content="${esc(cu)}"/><meta property="og:type" content="${d.ogType}"/><meta property="og:image" content="${esc(oi)}"/><meta property="og:site_name" content="FilaScope"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:site" content="@FilaScope"/><meta name="twitter:title" content="${esc(d.title)}"/><meta name="twitter:description" content="${esc(d.description)}"/><meta name="twitter:image" content="${esc(oi)}"/>${d.modifiedTime?`<meta property="article:modified_time" content="${esc(d.modifiedTime)}"/>`:``}${jld}</head><body><div id="root"><header><nav aria-label="Breadcrumb">${bc}</nav></header><main><h1>${esc(d.h1)}</h1><p>${esc(d.bodyText)}</p>${bl}</main><noscript><p>FilaScope requires JavaScript. Please enable it to use the full filament comparison tool.</p></noscript></div></body></html>`;
}

function build404Html(d: PageData): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${esc(d.title)}</title><meta name="description" content="${esc(d.description)}"/><meta name="robots" content="noindex,nofollow"/></head><body><div id="root"><main><h1>${esc(d.h1)}</h1><p>${esc(d.bodyText)}</p><nav><a href="${BASE_URL}/">Filaments</a> <a href="${BASE_URL}/printers">Printers</a> <a href="${BASE_URL}/deals">Deals</a> <a href="${BASE_URL}/brands">Brands</a></nav></main></div></body></html>`;
}

// ── Schema helpers ──
function bcSchema(items: {name:string;url:string}[]) {
  return {"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:items.map((it,i)=>({"@type":"ListItem",position:i+1,name:it.name,item:`${BASE_URL}${it.url}`}))};
}
function faqSch(faqs:{q:string;a:string}[]) {
  return {"@context":"https://schema.org","@type":"FAQPage",mainEntity:faqs.map(f=>({"@type":"Question",name:f.q,acceptedAnswer:{"@type":"Answer",text:f.a}}))};
}

// ── Material config (single source of truth) ──
const MAT_CFG: Record<string, {label:string; materials:string[]; ilike?:string}> = {
  pla:{label:"PLA",materials:["PLA","PLA+","PLA-HS","HTPLA","PLA Pro","PLA-CF","Matte PLA","Marble PLA","Wood PLA","Rainbow PLA"]},
  petg:{label:"PETG",materials:["PETG","PCTG","PETG-CF","PETG+","Co-Polyester"]},
  abs:{label:"ABS",materials:["ABS","ABS+","ABS-CF","ABS Pro"]},
  asa:{label:"ASA",materials:["ASA","ASA+","ASA-CF"]},
  tpu:{label:"TPU",materials:["TPU","TPU-95A","TPU-98A","TPE","Flexible"]},
  "pla-plus":{label:"PLA+",materials:["PLA+","PLA Pro","PLA-HS"]},
  "silk-pla":{label:"Silk PLA",materials:["Silk PLA","Silk PLA+","Silk"],ilike:"%silk%"},
  nylon:{label:"Nylon",materials:["PA","PA-CF","PA-GF","PA6","PA12","Nylon","Nylon-CF"]},
  pc:{label:"PC",materials:["PC","PC-CF","PC-ABS","PCTG","Polycarbonate"]},
  polycarbonate:{label:"PC",materials:["PC","PC-CF","PC-ABS","PCTG","Polycarbonate"]},
  "high-speed-pla":{label:"High Speed PLA",materials:["PLA-HS","PLA High Speed","High Speed PLA","Premium PLA High Speed"]},
  "petg-cf":{label:"PETG-CF",materials:["PETG-CF","PETG-GF","Carbon Fiber PETG"]},
};

const CAT_META: Record<string,{title:string;desc:string;h1:string;intro:string}> = {
  pla:{title:"PLA Filaments — Compare {n}+ Options | FilaScope",desc:"Compare {n}+ PLA 3D printer filaments by price, brand, TD value, and printer compatibility.",h1:"PLA Filaments",intro:"Compare {n} PLA filaments with real-time pricing, HueForge TD values, and printer compatibility data."},
  petg:{title:"PETG Filaments — Compare {n}+ Options | FilaScope",desc:"Compare {n}+ PETG 3D printer filaments. Stronger than PLA with better heat resistance.",h1:"PETG Filaments",intro:"Compare {n} PETG filaments with real-time pricing and compatibility data."},
  abs:{title:"ABS Filaments — Compare {n}+ Options | FilaScope",desc:"Compare {n}+ ABS 3D printer filaments. Heat-resistant and durable.",h1:"ABS Filaments",intro:"Compare {n} ABS filaments with specs, pricing, and compatibility data."},
  tpu:{title:"TPU Flexible Filaments — Compare {n}+ Options | FilaScope",desc:"Compare {n}+ TPU flexible 3D printer filaments.",h1:"TPU & Flexible Filaments",intro:"Compare {n} TPU filaments with specs and pricing."},
  asa:{title:"ASA Filaments — Compare {n}+ Options | FilaScope",desc:"Compare {n}+ ASA 3D printer filaments. UV-resistant for outdoor use.",h1:"ASA Filaments",intro:"Compare {n} ASA filaments with specs, pricing, and compatibility data."},
  "silk-pla":{title:"Silk PLA Filaments — Compare {n}+ Options | FilaScope",desc:"Compare {n}+ Silk PLA filaments with shimmery metallic finish.",h1:"Silk PLA Filaments",intro:"Compare {n} Silk PLA filaments with color options and pricing."},
  nylon:{title:"Nylon/PA Filaments — Compare {n}+ Options | FilaScope",desc:"Compare {n}+ Nylon and PA 3D printer filaments.",h1:"Nylon (PA) Filaments",intro:"Compare {n} Nylon filaments with specs and pricing."},
  "pla-plus":{title:"PLA+ Filaments — Compare {n}+ Options | FilaScope",desc:"Compare {n}+ PLA+ 3D printer filaments.",h1:"PLA+ Filaments",intro:"Compare {n} PLA+ filaments across brands with real-time pricing and specs."},
  "high-speed-pla":{title:"High Speed PLA — Compare {n}+ Options | FilaScope",desc:"Compare {n}+ High Speed PLA filaments for fast 3D printing.",h1:"High Speed PLA Filaments",intro:"Compare {n} high-speed PLA filaments with compatible printers and pricing data."},
  polycarbonate:{title:"Polycarbonate Filaments — Compare {n}+ PC Options | FilaScope",desc:"Compare {n}+ PC and Polycarbonate 3D printer filaments.",h1:"Polycarbonate (PC) Filaments",intro:"Compare {n} PC filaments."},
  "petg-cf":{title:"PETG Carbon Fiber — Compare {n}+ Options | FilaScope",desc:"Compare {n}+ PETG-CF carbon fiber 3D printer filaments.",h1:"PETG Carbon Fiber Filaments",intro:"Compare {n} PETG-CF filaments with specs and pricing."},
};
function applyN(t:string,n:number){return t.replace(/\{n\}/g,n.toLocaleString());}

const COLOR_MAP: Record<string,{label:string;families:string[];hf?:boolean}> = {
  white:{label:"White",families:["White"],hf:true},black:{label:"Black",families:["Black"]},
  blue:{label:"Blue",families:["Blue"]},red:{label:"Red",families:["Red"]},
  green:{label:"Green",families:["Green"]},gray:{label:"Gray",families:["Gray","Grey","Light Grey","Dark Grey","Silver Gray"]},
  yellow:{label:"Yellow",families:["Yellow"]},orange:{label:"Orange",families:["Orange"]},
  purple:{label:"Purple",families:["Purple","Violet"]},brown:{label:"Brown",families:["Brown","Tan","Beige"]},
  natural:{label:"Natural",families:["Natural","Beige","Cream"],hf:true},
  pink:{label:"Pink",families:["Pink","Rose","Magenta"]},
  clear:{label:"Clear",families:["Clear","Transparent","Natural Clear"],hf:true},
  gold:{label:"Gold",families:["Gold","Bronze"]},silver:{label:"Silver",families:["Silver","Chrome","Metallic"]},
};

const GUIDE_META: Record<string,{title:string;description:string}> = {
  "best-pla-filaments":{title:"Best PLA Filaments 2026",description:"The best PLA filaments ranked by print quality, consistency & value."},
  "best-petg-filaments":{title:"Best PETG Filaments 2026",description:"Top PETG filaments ranked by strength and print quality."},
  "best-abs-filaments":{title:"Best ABS Filaments 2026",description:"Top ABS filaments compared by heat resistance and print quality."},
  "pla-vs-petg":{title:"PLA vs PETG — Complete Comparison",description:"PLA vs PETG compared: strength, ease of printing, heat resistance, cost, and HueForge TD values."},
  "beginners-guide":{title:"3D Printing Filament Guide for Beginners",description:"Everything beginners need to know about 3D printer filament."},
  "hueforge-filaments":{title:"Best Filaments for HueForge 2026",description:"Find the best filaments for HueForge lithophanes with TD values."},
  "best-filaments-for-hueforge-lithophanes":{title:"Best Filaments for HueForge Lithophanes",description:"Top filaments for HueForge lithophanes ranked by TD value."},
  "pla-plus-vs-pla-pro":{title:"PLA+ vs PLA Pro — What's Different?",description:"PLA+ vs PLA Pro compared with real data."},
  "best-filament-for-bambu-lab-p1s":{title:"Best Filament for Bambu Lab P1S 2026",description:"Top filament picks for Bambu Lab P1S with AMS compatibility."},
  "silk-pla-comparison":{title:"Best Silk PLA Filaments 2026",description:"Top silk PLA filaments ranked by sheen quality."},
  "asa-vs-abs-outdoor-printing":{title:"ASA vs ABS for Outdoor 3D Prints",description:"ASA vs ABS for outdoor use: UV resistance, heat tolerance compared."},
};

// ── Simple static pages (consolidated) ──
type SP = {t:string;d:string;c:string;h:string;b:string;ot?:string;jld?:Record<string,unknown>[]};
const STATIC_PG: Record<string,SP> = {
  "/learn":{t:"3D Printing Knowledge Base | FilaScope",d:"Learn about 3D printing filaments: material guides, comparisons, and tips.",c:"/learn",h:"3D Printing Knowledge Base",b:"Guides, comparisons, and tips for 3D printer filaments."},
  "/compare":{t:"Compare 3D Filaments Side by Side | FilaScope",d:"Compare 3D printer filaments side by side.",c:"/compare",h:"Compare 3D Printer Filaments",b:"Compare filaments side by side across specs, prices, and compatibility."},
  "/colors":{t:"3D Filament Color Finder — Search by Color | FilaScope",d:"Find 3D printer filaments by exact color.",c:"/colors",h:"3D Filament Color Finder",b:"Search for 3D printer filaments by color."},
  "/color-finder":{t:"3D Filament Color Finder — Search by Color | FilaScope",d:"Find 3D printer filaments by exact color.",c:"/colors",h:"3D Filament Color Finder",b:"Search for 3D printer filaments by color."},
  "/about":{t:"About FilaScope — 3D Filament Database",d:"FilaScope is the most comprehensive 3D printer filament database.",c:"/about",h:"About FilaScope",b:"FilaScope helps makers find the perfect filament for every project."},
  "/methodology":{t:"Our Methodology — How FilaScope Ranks Filaments",d:"How FilaScope scores and ranks 3D printer filaments.",c:"/methodology",h:"FilaScope Methodology",b:"Learn how FilaScope collects data, scores filaments, and ranks products."},
  "/affiliate-disclosure":{t:"Affiliate Disclosure | FilaScope",d:"FilaScope Affiliate Disclosure.",c:"/affiliate-disclosure",h:"Affiliate Disclosure",b:"Transparency about how FilaScope earns revenue through affiliate partnerships.",ot:"website"},
  "/privacy":{t:"Privacy Policy | FilaScope",d:"FilaScope Privacy Policy.",c:"/privacy",h:"Privacy Policy",b:"Learn how FilaScope protects your personal information."},
  "/terms":{t:"Terms of Service | FilaScope",d:"FilaScope Terms of Service.",c:"/terms",h:"Terms of Service",b:"Terms and conditions governing your use of FilaScope."},
  "/wizard":{t:"Filament Wizard — Find Your Perfect 3D Filament | FilaScope",d:"Get personalized 3D printer filament recommendations.",c:"/wizard",h:"Filament Wizard",b:"Get personalized filament recommendations based on your project."},
  "/diagnose":{t:"3D Print Problem Diagnosis Tool | FilaScope",d:"Diagnose common 3D printing problems.",c:"/diagnose",h:"3D Print Problem Diagnosis",b:"Identify and fix common 3D printing problems."},
  "/accessories":{t:"3D Printer Accessories & Upgrades | FilaScope",d:"Browse essential 3D printer accessories and upgrades.",c:"/accessories",h:"3D Printer Accessories",b:"Browse and compare essential 3D printer accessories."},
  "/brands/compare":{t:"Compare Filament Brands — Side-by-Side | FilaScope",d:"Compare 3D printing filament brands side-by-side.",c:"/brands/compare",h:"Compare Filament Brands",b:"Compare 3D printing filament brands across product variety, pricing, and ratings."},
  "/materials/compare":{t:"Compare 3D Filaments Side by Side | FilaScope",d:"Compare 3D printer filaments side by side.",c:"/compare",h:"Compare 3D Printer Filaments",b:"Compare filaments side by side."},
  "/hueforge-td-database":{t:"HueForge TD Value Database — Filament Transmissivity | FilaScope",d:"Complete HueForge TD value database. Search transmission distance values for 500+ filaments.",c:"/hueforge-td-database",h:"HueForge TD Value Database",b:"Browse transmission distance (TD) values for 500+ filaments.",jld:[{"@context":"https://schema.org","@type":"Dataset",name:"HueForge TD Value Database",description:"TD values for 500+ 3D printer filaments",url:`${BASE_URL}/hueforge-td-database`,creator:{"@type":"Organization",name:"FilaScope",url:BASE_URL}}]},
  "/td-database":{t:"HueForge TD Value Database | FilaScope",d:"Search TD values for 500+ filaments.",c:"/hueforge-td-database",h:"HueForge TD Value Database",b:"Browse TD values for 500+ filaments."},
  "/hueforge-filaments":{t:"HueForge Filament Finder — TD-Ranked | FilaScope",d:"Find the best filaments for HueForge projects.",c:"/hueforge-filaments",h:"HueForge Filament Finder",b:"Find filaments for HueForge lithophane projects, ranked by TD value."},
  "/filament-database":{t:"3D Filament Database — Compare 1,080+ Products | FilaScope",d:"The most comprehensive 3D printer filament database.",c:"/filament-database",h:"3D Printer Filament Database",b:"Compare PLA, PETG, ABS & more across 48+ brands."},
  "/best-filaments-for-hueforge":{t:"Best Filaments for HueForge 2026 — TD-Ranked | FilaScope",d:"Find the best filaments for HueForge lithophanes. TD-ranked picks.",c:"/guides/best-filaments-for-hueforge",h:"Best Filaments for HueForge 2026",b:"HueForge lithophanes rely on TD values. We rank the top filaments by verified TD data.",ot:"article"},
  "/guides/best-filaments-for-hueforge":{t:"Best Filaments for HueForge 2026 — TD-Ranked | FilaScope",d:"Find the best filaments for HueForge lithophanes. TD-ranked picks.",c:"/guides/best-filaments-for-hueforge",h:"Best Filaments for HueForge 2026",b:"HueForge lithophanes rely on TD values. We rank the top filaments by verified TD data.",ot:"article"},
  "/pla-vs-petg":{t:"PLA vs PETG — 3D Filament Comparison | FilaScope",d:"PLA vs PETG compared: strength, flexibility, print settings, price & TD values.",c:"/guides/pla-vs-petg",h:"PLA vs PETG — Which Is Right for You?",b:"PLA vs PETG comparison using data from 1,080+ filaments.",ot:"article"},
  "/guides/pla-vs-petg":{t:"PLA vs PETG — 3D Filament Comparison | FilaScope",d:"PLA vs PETG compared: strength, flexibility, print settings, price & TD values.",c:"/guides/pla-vs-petg",h:"PLA vs PETG — Which Is Right for You?",b:"PLA vs PETG comparison using data from 1,080+ filaments.",ot:"article"},
  "/best-filaments-for-beginners":{t:"Best Filaments for Beginners 2026 | FilaScope",d:"The best 3D printer filaments for beginners.",c:"/guides/best-filaments-for-beginners",h:"Best Filaments for Beginners 2026",b:"Easy-to-print filament recommendations for new 3D printer owners.",ot:"article"},
  "/guides/best-filaments-for-beginners":{t:"Best Filaments for Beginners 2026 | FilaScope",d:"The best 3D printer filaments for beginners.",c:"/guides/best-filaments-for-beginners",h:"Best Filaments for Beginners 2026",b:"Easy-to-print filament recommendations for new 3D printer owners.",ot:"article"},
  "/best-white-filaments":{t:"Best White Filaments for 3D Printing & HueForge | FilaScope",d:"Compare white 3D printer filaments ranked by TD value, print quality & price.",c:"/best-white-filaments",h:"Best White Filaments for 3D Printing & HueForge",b:"White filaments ranked by TD value from 48+ brands.",ot:"article"},
};

function staticPage(path: string): PageData | null {
  const sp = STATIC_PG[path];
  if (!sp) return null;
  const crumbs = sp.c.split("/").filter(Boolean);
  const bc = [{name:"Home",url:"/"}];
  let accum = "";
  for (const seg of crumbs) {
    accum += `/${seg}`;
    bc.push({name:seg.charAt(0).toUpperCase()+seg.slice(1).replace(/-/g," "),url:accum});
  }
  return {type:"page",title:sp.t,description:sp.d,canonical:sp.c,ogType:sp.ot||"website",
    jsonLd:[...(sp.jld||[]),bcSchema(bc)],breadcrumbs:bc,h1:sp.h,bodyText:sp.b};
}

// ── Dynamic page handlers ──
function homepage(): PageData {
  return {type:"homepage",title:"FilaScope — 3D Printer Filament Database & Price Comparison",
    description:"Compare 3D printer filaments across 50+ brands. Find specs, prices, HueForge TD values & printer compatibility.",
    canonical:"/",ogType:"website",
    jsonLd:[{"@context":"https://schema.org","@type":"WebSite",name:"FilaScope",url:BASE_URL,description:"The most comprehensive 3D printer filament database.",potentialAction:{"@type":"SearchAction",target:{"@type":"EntryPoint",urlTemplate:`${BASE_URL}/?search={search_term_string}`},"query-input":"required name=search_term_string"}},{"@context":"https://schema.org","@type":"Organization",name:"FilaScope",url:BASE_URL,logo:`${BASE_URL}/og-image.png`}],
    breadcrumbs:[{name:"Home",url:"/"}],h1:"FilaScope — 3D Printer Filament Database",
    bodyText:"Compare 3D printer filaments across 50+ brands."};
}

async function filamentListingPage(sb: SupabaseClient): Promise<PageData> {
  const {count} = await sb.from("filaments").select("id",{count:"exact",head:true});
  const n = count??0;
  const {data:top} = await sb.from("filaments").select("product_handle,id,product_title,display_name,vendor,material,variant_price,filascope_score,variant_available").not("filascope_score","is",null).order("filascope_score",{ascending:false}).limit(50);
  const items = (top??[]) as any[];
  const links = items.map((f:any)=>({href:`${BASE_URL}/filament/${f.product_handle||f.id}`,text:f.display_name||f.product_title||"Filament"}));
  const crumbs = [{name:"Home",url:"/"},{name:"Filaments",url:"/filaments"}];
  return {type:"listing",title:`3D Printer Filaments — Compare ${n}+ | FilaScope`,description:`Browse ${n}+ 3D printer filaments from 48+ brands.`,canonical:"/filaments",ogType:"website",jsonLd:[bcSchema(crumbs)],breadcrumbs:crumbs,h1:"3D Printer Filament Database",bodyText:`Browse all ${n}+ filaments from 48+ brands.`,links};
}

async function filamentCategoryPage(slug:string, sb:SupabaseClient, page=0): Promise<PageData> {
  const cfg = MAT_CFG[slug]; if(!cfg) return fallback(`/filaments/${slug}`);
  const meta = CAT_META[slug]??CAT_META["pla"];
  const PS=50, offset=page*PS;
  let cq = sb.from("filaments").select("id",{count:"exact",head:true});
  if(cfg.ilike) cq = (sb as any).from("filaments").select("id",{count:"exact",head:true}).or(cfg.materials.map(m=>`material.eq.${m}`).join(",")+`,material.ilike.${cfg.ilike}`);
  else cq = cq.in("material",cfg.materials);
  const {count} = await cq; const n=count??0;
  const {data:top} = await (sb as any).from("filaments").select("product_handle,id,product_title,display_name,vendor,material,variant_price,filascope_score,variant_available").in("material",cfg.materials).not("filascope_score","is",null).order("filascope_score",{ascending:false}).range(offset,offset+PS-1);
  const items=(top??[]) as any[];
  const links=items.map((f:any)=>({href:`${BASE_URL}/filament/${f.product_handle||f.id}`,text:f.display_name||f.product_title||"Filament"}));
  const can=`/filaments/${slug}`;
  const crumbs=[{name:"Home",url:"/"},{name:"Filaments",url:"/filaments"},{name:cfg.label,url:can}];
  const tp=Math.ceil(n/PS);
  const bc=`${BASE_URL}${can}`;
  return {type:"listing",title:applyN(meta.title,n),description:applyN(meta.desc,n),canonical:can,ogType:"website",jsonLd:[bcSchema(crumbs)],breadcrumbs:crumbs,h1:meta.h1,bodyText:applyN(meta.intro,n),links,paginationPrev:page>0?(page===1?bc:`${bc}?page=${page}`):undefined,paginationNext:page<tp-1?`${bc}?page=${page+2}`:undefined};
}

async function filamentPage(slug:string, sb:SupabaseClient): Promise<PageData> {
  const cols="id,product_handle,product_title,display_name,vendor,material,color_family,color_hex,variant_price,featured_image,diameter_nominal_mm,net_weight_g,nozzle_temp_min_c,nozzle_temp_max_c,bed_temp_min_c,bed_temp_max_c,transmission_distance,filascope_score,updated_at,last_scraped_at";
  let {data} = await sb.from("filaments").select(cols).eq("product_handle",slug).limit(1).maybeSingle();
  if(!data && slug.match(/^[0-9a-f-]{36}$/i)){const r=await sb.from("filaments").select(cols).eq("id",slug).limit(1).maybeSingle();data=r.data;}
  if(!data) return fallback(`/filament/${slug}`);
  const name=data.display_name||data.product_title||"Filament",brand=data.vendor||"",mat=data.material||"",col=data.color_family||"",hex=data.color_hex||null,price=data.variant_price,td=data.transmission_distance,score=data.filascope_score,mod=data.last_scraped_at||data.updated_at||null;
  const cs=data.product_handle||data.id,can=`/filament/${cs}`,cp=col?` ${col}`:"";
  const sfx=" | FilaScope";
  let title = td?`${brand} ${name}${cp} — ${mat} | TD ${td}${sfx}`:`${brand} ${name}${cp} — ${mat} Filament${sfx}`;
  if(title.length>60) title=`${brand} ${name}${sfx}`;
  const ns=data.nozzle_temp_min_c&&data.nozzle_temp_max_c?`Nozzle ${data.nozzle_temp_min_c}-${data.nozzle_temp_max_c}°C.`:"";
  const ps=price?`From $${price}.`:"";
  let desc=td?`${brand} ${name}${cp} ${mat} filament with TD ${td}. ${ns} ${ps} Compare on FilaScope.`:`${brand} ${name}${cp} ${mat} filament. ${ns} ${ps} Compare on FilaScope.`;
  desc=desc.replace(/\s+/g," ").trim(); if(desc.length>160) desc=desc.slice(0,157)+"...";
  const ap: Record<string,unknown>[]=[];
  if(mat) ap.push({"@type":"PropertyValue",name:"Material Type",value:mat});
  if(td!=null) ap.push({"@type":"PropertyValue",name:"HueForge TD",value:td});
  if(data.nozzle_temp_min_c&&data.nozzle_temp_max_c) ap.push({"@type":"PropertyValue",name:"Nozzle Temp",value:`${data.nozzle_temp_min_c}-${data.nozzle_temp_max_c}°C`});
  if(hex) ap.push({"@type":"PropertyValue",name:"Color Hex",value:hex});
  if(score!=null) ap.push({"@type":"PropertyValue",name:"FilaScore",value:score});
  const pvu=new Date(Date.now()+30*864e5).toISOString().split("T")[0];
  const psc:Record<string,unknown>={"@context":"https://schema.org","@type":"Product",name:`${brand} ${name}`,description:desc,...(data.featured_image&&{image:data.featured_image}),...(brand&&{brand:{"@type":"Brand",name:brand}}),sku:cs,category:`3D Printer Filament${mat?` - ${mat}`:""}`,url:`${BASE_URL}${can}`,...(ap.length>0&&{additionalProperty:ap})};
  if(price) psc.offers={"@type":"Offer",priceCurrency:"USD",price:price.toFixed(2),priceValidUntil:pvu,availability:"https://schema.org/InStock",url:`${BASE_URL}${can}`};
  const faqs:Record<string,unknown>[]=[];
  if(data.nozzle_temp_min_c&&data.nozzle_temp_max_c){const mid=Math.round((data.nozzle_temp_min_c+data.nozzle_temp_max_c)/2);faqs.push({"@type":"Question",name:`What nozzle temp for ${brand} ${name}?`,acceptedAnswer:{"@type":"Answer",text:`${data.nozzle_temp_min_c}–${data.nozzle_temp_max_c}°C, start at ${mid}°C.`}});}
  if(td) faqs.push({"@type":"Question",name:`What is the TD value for ${brand} ${name}?`,acceptedAnswer:{"@type":"Answer",text:`TD value is ${td}.`}});
  const crumbs=[{name:"Home",url:"/"},{name:"Filaments",url:"/"},...(brand?[{name:brand,url:`/brands/${brand.toLowerCase().replace(/\s+/g,"-")}`}]:[]),{name,url:can}];
  const h1f=`${brand} ${name}${cp} — ${mat} Filament`;
  return {type:"product",title,description:desc,canonical:can,ogImage:buildOgImageUrl({type:"product",title:`${brand} ${name}`,subtitle:mat,price:price?`From $${price}`:undefined,image:data.featured_image||undefined}),ogType:"product",jsonLd:faqs.length>0?[psc,bcSchema(crumbs),{"@context":"https://schema.org","@type":"FAQPage",mainEntity:faqs}]:[psc,bcSchema(crumbs)],breadcrumbs:crumbs,h1:h1f.length<=70?h1f:`${brand} ${name}${cp}`,bodyText:`Specs, pricing, and compatibility for ${brand} ${name}${cp} ${mat} filament${td?`. TD: ${td}`:""}.`,...(mod&&{modifiedTime:mod})};
}

async function brandPage(slug:string,sb:SupabaseClient): Promise<PageData> {
  const {data} = await sb.from("automated_brands").select("brand_name,display_name,brand_slug,description,logo_url,product_count,website_url").eq("brand_slug",slug).limit(1).maybeSingle();
  if(!data) return fallback(`/brands/${slug}`);
  const bn=data.display_name||data.brand_name,cnt=data.product_count||0,can=`/brands/${data.brand_slug}`;
  let title=`${bn} 3D Filaments — ${cnt} Products | FilaScope`; if(title.length>60) title=`${bn} Filaments | FilaScope`;
  const crumbs=[{name:"Home",url:"/"},{name:"Brands",url:"/brands"},{name:bn,url:can}];
  return {type:"brand",title,description:`Browse all ${cnt} ${bn} 3D printer filaments. Compare specs and prices on FilaScope.`,canonical:can,ogImage:buildOgImageUrl({type:"brand",title:`${bn} 3D Filaments`,subtitle:`${cnt} products`,image:data.logo_url||undefined}),ogType:"profile",jsonLd:[{"@context":"https://schema.org","@type":"Organization",name:bn,url:data.website_url||`${BASE_URL}${can}`,...(data.logo_url&&{logo:data.logo_url})},bcSchema(crumbs)],breadcrumbs:crumbs,h1:`${bn} 3D Filaments`,bodyText:data.description||`Browse ${cnt} ${bn} filament products.`};
}

async function brandsListing(sb:SupabaseClient): Promise<PageData> {
  const {count}=await sb.from("automated_brands").select("id",{count:"exact",head:true}).eq("is_visible",true);
  const n=count||50; const crumbs=[{name:"Home",url:"/"},{name:"Brands",url:"/brands"}];
  return {type:"listing",title:`3D Filament Brands — ${n}+ Brands | FilaScope`,description:`Compare ${n}+ 3D printer filament brands.`,canonical:"/brands",ogType:"website",jsonLd:[bcSchema(crumbs)],breadcrumbs:crumbs,h1:"3D Filament Brands",bodyText:`Browse ${n} filament brands.`};
}

async function printerPage(slug:string,sb:SupabaseClient): Promise<PageData> {
  const inputSlug = normSlug(decodeURIComponent(slug));
  const cols="id,printer_id,model_name,display_name,brand_id,msrp_usd,build_volume_x_mm,build_volume_y_mm,build_volume_z_mm";
  let {data}=await sb.from("printers").select(cols).eq("printer_id",slug).limit(1).maybeSingle();
  if(!data&&inputSlug!==slug){const r=await sb.from("printers").select(cols).eq("printer_id",inputSlug).limit(1).maybeSingle();data=r.data;}
  if(!data){const r=await sb.from("printers").select(cols).ilike("printer_id",buildPrinterIlikePattern(inputSlug)).limit(10);data=r.data?.find(p=>normSlug(p.printer_id||p.id)===inputSlug)||r.data?.[0]||null;}
  if(!data&&slug.match(/^[0-9a-f-]{36}$/i)){const r=await sb.from("printers").select(cols).eq("id",slug).limit(1).maybeSingle();data=r.data;}
  if(!data) return fallback(`/printers/${inputSlug||slug}`);
  let bn=""; if(data.brand_id){const{data:b}=await sb.from("printer_brands").select("brand").eq("id",data.brand_id).limit(1).maybeSingle();bn=b?.brand||"";}
  const pn=data.display_name||data.model_name||"3D Printer",full=bn?`${bn} ${pn}`:pn,cs=normSlug(data.printer_id||data.id),can=`/printers/${cs}`;
  let title=`${full} — Specs & Price | FilaScope`; if(title.length>60) title=`${full} | FilaScope`;
  let desc=`${full}. Full specs, filament compatibility & prices.`; if(desc.length>160) desc=desc.slice(0,157)+"...";
  const ps:Record<string,unknown>={"@context":"https://schema.org","@type":"Product",name:full,description:desc,...(bn&&{brand:{"@type":"Brand",name:bn}}),sku:cs,category:"3D Printer",url:`${BASE_URL}${can}`};
  if(data.msrp_usd) ps.offers={"@type":"Offer",priceCurrency:"USD",price:data.msrp_usd.toFixed(2),availability:"https://schema.org/InStock",url:`${BASE_URL}${can}`};
  const crumbs=[{name:"Home",url:"/"},{name:"Printers",url:"/printers"},{name:full,url:can}];
  return {type:"product",title,description:desc,canonical:can,ogType:"product",jsonLd:[ps,bcSchema(crumbs)],breadcrumbs:crumbs,h1:full,bodyText:desc};
}

async function printersListing(sb:SupabaseClient): Promise<PageData> {
  const {count}=await sb.from("printers").select("id",{count:"exact",head:true});
  const n=count||100;const crumbs=[{name:"Home",url:"/"},{name:"Printers",url:"/printers"}];
  return {type:"listing",title:"3D Printer Database — Specs & Compatibility | FilaScope",description:`Compare ${n} 3D printers.`,canonical:"/printers",ogType:"website",jsonLd:[bcSchema(crumbs)],breadcrumbs:crumbs,h1:"3D Printer Database",bodyText:`Compare ${n} 3D printers.`};
}

async function dealsPage(sb:SupabaseClient): Promise<PageData> {
  const {count}=await sb.from("filaments").select("id",{count:"exact",head:true}).not("variant_compare_at_price","is",null).not("variant_price","is",null);
  const n=count||0;const crumbs=[{name:"Home",url:"/"},{name:"Deals",url:"/deals"}];
  return {type:"deals",title:`3D Filament Deals — ${n} Offers | FilaScope`,description:`${n} active deals.`,canonical:"/deals",ogType:"website",jsonLd:[bcSchema(crumbs)],breadcrumbs:crumbs,h1:"3D Printer Filament Deals",bodyText:`Browse ${n} active deals.`};
}

function guidePage(slug:string): PageData {
  const m=GUIDE_META[slug]; if(!m) return fallback(`/guides/${slug}`);
  let title=`${m.title} | FilaScope`; if(title.length>60) title=m.title;
  const can=`/guides/${slug}`;const crumbs=[{name:"Home",url:"/"},{name:"Learn",url:"/learn"},{name:m.title,url:can}];
  return {type:"guide",title,description:m.description,canonical:can,ogImage:buildOgImageUrl({type:"guide",title:m.title}),ogType:"article",jsonLd:[{"@context":"https://schema.org","@type":"Article",headline:m.title,description:m.description,publisher:{"@type":"Organization",name:"FilaScope",url:BASE_URL},url:`${BASE_URL}${can}`},bcSchema(crumbs)],breadcrumbs:crumbs,h1:m.title,bodyText:m.description};
}

async function materialPage(slug:string,sb:SupabaseClient): Promise<PageData> {
  const cfg=MAT_CFG[slug]; if(!cfg) return fallback(`/materials/${slug}`);
  const {count}=await sb.from("filaments").select("id",{count:"exact",head:true}).in("material",cfg.materials);
  const n=count??0; if(n<3) return fallback(`/materials/${slug}`);
  const can=`/materials/${slug}`;const crumbs=[{name:"Home",url:"/"},{name:"Materials",url:"/filaments"},{name:cfg.label,url:can}];
  return {type:"material",title:`${cfg.label} Filament — ${n} Products | FilaScope`,description:`Browse ${n} ${cfg.label} 3D printer filaments.`,canonical:can,ogType:"website",jsonLd:[bcSchema(crumbs)],breadcrumbs:crumbs,h1:`${cfg.label} Filament — ${n} Products`,bodyText:`Browse ${n} ${cfg.label} filaments.`};
}

async function colorFamilyPage(slug:string,sb:SupabaseClient): Promise<PageData> {
  const cfg=COLOR_MAP[slug]; if(!cfg) return fallback(`/colors/${slug}`);
  const {count}=await sb.from("filaments").select("id",{count:"exact",head:true}).in("color_family",cfg.families);
  const n=count??0; if(n<3) return fallback(`/colors/${slug}`);
  const can=`/colors/${slug}`;const crumbs=[{name:"Home",url:"/"},{name:"Color Finder",url:"/colors"},{name:`${cfg.label} Filaments`,url:can}];
  return {type:"color",title:`${cfg.label} 3D Printer Filaments — ${n} Options | FilaScope`,description:`Browse ${n} ${cfg.label.toLowerCase()} 3D printer filaments.`,canonical:can,ogType:"website",jsonLd:[bcSchema(crumbs)],breadcrumbs:crumbs,h1:`${cfg.label} 3D Printer Filaments`,bodyText:`Browse ${n} ${cfg.label.toLowerCase()} filaments.`};
}

async function brandMaterialPage(bs:string,ms:string,sb:SupabaseClient): Promise<PageData> {
  const cfg=MAT_CFG[ms]; if(!cfg) return fallback(`/brands/${bs}/${ms}`);
  const {data:bd}=await sb.from("automated_brands").select("brand_name,display_name,brand_slug").eq("brand_slug",bs).maybeSingle();
  if(!bd) return fallback(`/brands/${bs}/${ms}`);
  const bn=(bd.display_name||bd.brand_name) as string;
  const {count}=await (sb as any).from("filaments").select("id",{count:"exact",head:true}).in("material",cfg.materials).ilike("vendor",bd.brand_name);
  const n=count??0; if(n<3) return fallback(`/brands/${bs}/${ms}`);
  const can=`/brands/${bs}/${ms}`;const crumbs=[{name:"Home",url:"/"},{name:"Brands",url:"/brands"},{name:bn,url:`/brands/${bs}`},{name:`${cfg.label} Filaments`,url:can}];
  return {type:"brand-material",title:`${bn} ${cfg.label} Filaments | FilaScope`,description:`Browse ${n} ${bn} ${cfg.label} filaments.`,canonical:can,ogType:"website",jsonLd:[bcSchema(crumbs)],breadcrumbs:crumbs,h1:`${bn} ${cfg.label} Filaments`,bodyText:`Browse ${n} ${bn} ${cfg.label} filaments.`};
}

function fallback(path:string): PageData {
  return {type:"notfound",title:"Page Not Found | FilaScope",description:"Page not found.",canonical:path,ogType:"website",jsonLd:[],breadcrumbs:[{name:"Home",url:"/"}],h1:"Page Not Found",bodyText:"The page you're looking for doesn't exist."};
}

// ── Router ──
async function getPageData(path:string, sb:SupabaseClient, qs?:string): Promise<PageData> {
  if(path==="/"||path==="") return homepage();
  // Static pages first
  const sp=staticPage(path); if(sp) return sp;
  if(path==="/filaments") return filamentListingPage(sb);
  const flm=path.match(/^\/filaments\/([^/]+)$/); if(flm){const p=qs?new URLSearchParams(qs).get("page"):null;return filamentCategoryPage(flm[1],sb,p?Math.max(0,parseInt(p,10)-1):0);}
  const fm=path.match(/^\/filament\/(.+)$/); if(fm) return filamentPage(fm[1],sb);
  const bmm=path.match(/^\/brands\/([^/]+)\/([^/]+)$/); if(bmm) return brandMaterialPage(bmm[1],bmm[2],sb);
  const bm=path.match(/^\/brands\/(.+)$/); if(bm) return brandPage(bm[1],sb);
  if(path==="/brands") return brandsListing(sb);
  const pm=path.match(/^\/printers\/(.+)$/); if(pm) return printerPage(normSlug(decodeURIComponent(pm[1])),sb);
  if(path==="/printers") return printersListing(sb);
  if(path==="/deals") return dealsPage(sb);
  const gm=path.match(/^\/guides\/(.+)$/); if(gm) return guidePage(gm[1]);
  const mm=path.match(/^\/materials\/(.+)$/); if(mm) return materialPage(mm[1],sb);
  const cm=path.match(/^\/colors\/(.+)$/); if(cm) return colorFamilyPage(cm[1],sb);
  return fallback(path);
}

// ── Sitemap helpers ──
function escXml(s:string){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");}
function w3c(d:string|null){if(!d) return new Date().toISOString().split("T")[0];try{return new Date(d).toISOString().split("T")[0]}catch{return new Date().toISOString().split("T")[0]}}
function ue(loc:string,lm:string,cf:string,p:number){return `  <url><loc>${escXml(loc)}</loc><lastmod>${lm}</lastmod><changefreq>${cf}</changefreq><priority>${p.toFixed(1)}</priority></url>`;}
function wrap(e:string[]){return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${e.join("\n")}\n</urlset>`;}
const SH={"Content-Type":"application/xml; charset=utf-8","Cache-Control":"public, max-age=3600, s-maxage=86400"};

const SP_LIST = [
  {p:"/",pr:1.0,cf:"daily"},{p:"/filaments",pr:0.9,cf:"daily"},{p:"/deals",pr:0.9,cf:"daily"},
  {p:"/printers",pr:0.9,cf:"weekly"},{p:"/brands",pr:0.9,cf:"weekly"},
  {p:"/filaments/pla",pr:0.8,cf:"daily"},{p:"/filaments/petg",pr:0.8,cf:"daily"},
  {p:"/filaments/abs",pr:0.8,cf:"weekly"},{p:"/filaments/tpu",pr:0.8,cf:"weekly"},
  {p:"/filaments/asa",pr:0.8,cf:"weekly"},{p:"/filaments/silk-pla",pr:0.8,cf:"weekly"},
  {p:"/filaments/pla-plus",pr:0.8,cf:"weekly"},{p:"/filaments/nylon",pr:0.8,cf:"weekly"},
  {p:"/filaments/high-speed-pla",pr:0.8,cf:"weekly"},{p:"/filaments/polycarbonate",pr:0.8,cf:"weekly"},
  {p:"/filaments/petg-cf",pr:0.7,cf:"weekly"},
  {p:"/materials/pla",pr:0.8,cf:"weekly"},{p:"/materials/petg",pr:0.8,cf:"weekly"},
  {p:"/materials/abs",pr:0.8,cf:"weekly"},{p:"/materials/tpu",pr:0.8,cf:"weekly"},
  {p:"/materials/asa",pr:0.8,cf:"weekly"},{p:"/materials/pla-plus",pr:0.8,cf:"weekly"},
  {p:"/materials/silk-pla",pr:0.7,cf:"weekly"},{p:"/materials/nylon",pr:0.7,cf:"weekly"},
  {p:"/materials/pc",pr:0.7,cf:"weekly"},
  {p:"/brands/compare",pr:0.7,cf:"monthly"},{p:"/compare",pr:0.7,cf:"monthly"},
  {p:"/wizard",pr:0.7,cf:"monthly"},{p:"/colors",pr:0.7,cf:"monthly"},
  {p:"/hueforge-td-database",pr:0.7,cf:"weekly"},{p:"/hueforge-filaments",pr:0.7,cf:"weekly"},
  {p:"/hueforge-palette-builder",pr:0.7,cf:"weekly"},{p:"/hueforge-layer-preview",pr:0.7,cf:"weekly"},
  {p:"/hueforge-color-matcher",pr:0.7,cf:"weekly"},{p:"/hueforge-project-planner",pr:0.7,cf:"weekly"},
  {p:"/hueforge-filament-substitute-finder",pr:0.7,cf:"weekly"},{p:"/hueforge-tools",pr:0.7,cf:"weekly"},
  {p:"/accessories",pr:0.7,cf:"weekly"},{p:"/diagnose",pr:0.7,cf:"monthly"},
  {p:"/matrix",pr:0.7,cf:"weekly"},{p:"/learn",pr:0.5,cf:"weekly"},
  {p:"/reference/slicers",pr:0.5,cf:"monthly"},{p:"/reference/repos",pr:0.5,cf:"monthly"},
  {p:"/about",pr:0.3,cf:"monthly"},{p:"/methodology",pr:0.3,cf:"monthly"},
  {p:"/affiliate-disclosure",pr:0.3,cf:"monthly"},{p:"/privacy",pr:0.3,cf:"monthly"},{p:"/terms",pr:0.3,cf:"monthly"},
];

const GUIDE_DATES: Record<string,{date:string;tl?:boolean;learn?:boolean}> = {
  "best-pla-filaments":{date:"2026-01-10"},"best-petg-filaments":{date:"2026-01-10"},"best-abs-filaments":{date:"2026-01-10"},
  "best-filament-for-bambu-lab-p1s":{date:"2026-01-14"},"silk-pla-comparison":{date:"2026-01-18"},
  "asa-vs-abs-outdoor-printing":{date:"2026-01-16"},"pla-plus-vs-pla-pro":{date:"2026-01-12"},
  "pla-vs-petg":{date:"2026-01-15"},"best-filaments-for-beginners":{date:"2026-01-08"},
  "best-filaments-for-hueforge":{date:"2026-01-20"},
  "what-is-hueforge-td":{date:"2026-02-20"},"best-white-filaments-for-hueforge":{date:"2026-02-20"},
  "how-to-measure-filament-td":{date:"2026-02-20"},"best-filaments-for-outdoor-use":{date:"2026-02-20"},
  "best-filaments-for-lithophanes":{date:"2026-02-20"},
  "best-filaments-for-miniatures":{date:"2026-02-28"},"best-filaments-for-cosplay":{date:"2026-02-28"},
  "best-food-safe-filaments":{date:"2026-02-28"},"best-filaments-for-functional-parts":{date:"2026-02-28"},
  "best-tpu-filaments":{date:"2026-02-28"},
  "pla-vs-abs":{date:"2026-02-28"},"petg-vs-abs":{date:"2026-02-28"},
  "tpu-vs-petg":{date:"2026-02-28"},"nylon-vs-petg":{date:"2026-02-28"},
  "how-to-choose-3d-printer-filament":{date:"2026-02-28"},
  "best-filament-for-bambu-lab-a1-mini":{date:"2026-02-28"},
  "best-filament-for-creality-ender-3-v3":{date:"2026-02-28"},
  "best-filament-for-bambu-lab-x1-carbon":{date:"2026-02-28"},
  "best-filament-for-creality-k1-max":{date:"2026-02-28"},
  "filament-temperature-guide":{date:"2026-02-28"},
  "3d-printer-filament-types-explained":{date:"2026-02-28"},
  "best-budget-filaments":{date:"2026-02-28"},
  "best-asa-filaments":{date:"2026-02-28"},"best-nylon-filaments":{date:"2026-02-28"},
  "best-pc-filaments":{date:"2026-02-28"},"best-high-speed-pla-filaments":{date:"2026-02-28"},
  "how-to-choose-filament":{date:"2026-02-28"},"strongest-3d-printer-filament":{date:"2026-02-28"},
  "how-to-store-filament":{date:"2026-02-28"},"how-to-dry-filament":{date:"2026-02-28"},
  "food-safe-filament":{date:"2026-02-28"},
  "hueforge-beginners-guide":{date:"2026-02-20"},"understanding-td-values":{date:"2026-02-20"},
  "hueforge-color-selection":{date:"2026-02-20"},
  "best-filament-for-prusa-mk4":{date:"2026-02-20"},"best-filament-for-creality-k1":{date:"2026-02-20"},
  "best-filaments-for-hueforge-lithophanes":{date:"2026-02-20"},
};

async function smFilaments(sb:SupabaseClient){const e:string[]=[];let o=0;const B=1000;let m=true;while(m){const{data,error}=await sb.from("filaments").select("product_handle,id,updated_at,last_scraped_at").not("product_handle","is",null).order("id").range(o,o+B-1);if(error||!data||!data.length){m=false;break;}for(const f of data){const bd=[f.last_scraped_at,f.updated_at].filter(Boolean).sort().pop();e.push(ue(`${BASE_URL}/filament/${f.product_handle||f.id}`,w3c(bd),"daily",0.8));}m=data.length>=B;o+=B;}return wrap(e);}
async function smBrands(sb:SupabaseClient){const e:string[]=[];let o=0;const B=1000;let m=true;while(m){const{data,error}=await sb.from("automated_brands").select("brand_slug,updated_at,last_scrape_at").eq("is_visible",true).order("brand_slug").range(o,o+B-1);if(error||!data||!data.length){m=false;break;}for(const b of data){const bd=[b.last_scrape_at,b.updated_at].filter(Boolean).sort().pop();e.push(ue(`${BASE_URL}/brands/${b.brand_slug}`,w3c(bd),"weekly",0.8));}m=data.length>=B;o+=B;}return wrap(e);}
async function smPrinters(sb:SupabaseClient){const e:string[]=[];let o=0;const B=1000;let m=true;while(m){const{data,error}=await sb.from("printers").select("printer_id,id,updated_at").order("id").range(o,o+B-1);if(error||!data||!data.length){m=false;break;}for(const p of data){const slug=normSlug(p.printer_id||"")||normSlug(p.id);e.push(ue(`${BASE_URL}/printers/${slug}`,w3c(p.updated_at),"weekly",0.8));}m=data.length>=B;o+=B;}return wrap(e);}
async function smColors(sb:SupabaseClient){const t=new Date().toISOString().split("T")[0];const e:string[]=[];const{data}=await sb.from("color_families").select("name").order("display_order",{ascending:true});if(data)for(const c of data)e.push(ue(`${BASE_URL}/colors/${c.name.toLowerCase().replace(/\s+/g,"-")}`,t,"weekly",0.7));return wrap(e);}
function smPages(){const t=new Date().toISOString().split("T")[0];return wrap(SP_LIST.map(p=>ue(`${BASE_URL}${p.p}`,t,p.cf,p.pr)));}
const GUIDE_PRI_09=new Set(["best-pla-filaments","best-petg-filaments","best-abs-filaments","best-filaments-for-hueforge"]);
const GUIDE_PRI_08=new Set(["pla-vs-petg","silk-pla-comparison","asa-vs-abs-outdoor-printing","pla-plus-vs-pla-pro","what-is-hueforge-td","how-to-measure-filament-td"]);
function guideP(s:string){return GUIDE_PRI_09.has(s)?0.9:GUIDE_PRI_08.has(s)?0.8:0.7;}
function smGuides(){const t=new Date().toISOString().split("T")[0];return wrap(Object.entries(GUIDE_DATES).map(([s,{date,tl,learn}])=>ue(`${BASE_URL}/${tl?s:learn?`learn/${s}`:`guides/${s}`}`,date||t,"monthly",guideP(s))));}
async function smIndex(sb:SupabaseClient){const t=new Date().toISOString().split("T")[0];const maxGuide=Object.values(GUIDE_DATES).map(g=>g.date||"").filter(Boolean).sort().pop()||t;const[fR,bR,pR]= await Promise.all([sb.from("filaments").select("updated_at,last_scraped_at").order("updated_at",{ascending:false}).limit(1).single(),sb.from("automated_brands").select("updated_at,last_scrape_at").eq("is_visible",true).order("updated_at",{ascending:false}).limit(1).single(),sb.from("printers").select("updated_at").order("updated_at",{ascending:false}).limit(1).single()]);const fD=w3c([fR.data?.last_scraped_at,fR.data?.updated_at].filter(Boolean).sort().pop());const bD=w3c([bR.data?.last_scrape_at,bR.data?.updated_at].filter(Boolean).sort().pop());const pD=w3c(pR.data?.updated_at);const subs:[string,string][]=[ ["sitemap-pages.xml",t],["sitemap-filaments.xml",fD||t],["sitemap-brands.xml",bD||t],["sitemap-printers.xml",pD||t],["sitemap-guides.xml",maxGuide],["sitemap-colors.xml",t] ];return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${subs.map(([s,d])=>`  <sitemap>\n    <loc>${BASE_URL}/${s}</loc>\n    <lastmod>${d}</lastmod>\n  </sitemap>`).join("\n")}\n</sitemapindex>`;}

function isCrawler(ua:string|null){if(!ua)return false;const l=ua.toLowerCase();return CRAWLER_AGENTS.some(b=>l.includes(b));}

const GUIDE_REDIRECTS: Record<string,string> = {
  "/guides/beginners-guide":`${BASE_URL}/guides/best-filaments-for-beginners`,
  "/guides/best-filament-for-beginners-2025":`${BASE_URL}/guides/best-filaments-for-beginners`,
  "/guides/hueforge-filaments":`${BASE_URL}/guides/best-filaments-for-hueforge`,
  "/guides/best-filaments-for-hueforge-lithophanes":`${BASE_URL}/guides/best-filaments-for-hueforge`,
  "/best-filaments-for-hueforge":`${BASE_URL}/guides/best-filaments-for-hueforge`,
  "/best-filaments-for-beginners":`${BASE_URL}/guides/best-filaments-for-beginners`,
  "/pla-vs-petg":`${BASE_URL}/guides/pla-vs-petg`,
  "/learn/hueforge":`${BASE_URL}/guides/what-is-hueforge-td`,
};

// ── Main handler ──
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, {headers:corsHeaders});
  try {
    const url = new URL(req.url);
    const ua = req.headers.get("user-agent");
    const rawReqPath = url.searchParams.get("path") || "/";
    
    // Test endpoint
    if (rawReqPath === "/api/prerender-test" || url.pathname.endsWith("/api/prerender-test")) {
      const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const tp = url.searchParams.get("testpath") || "/";
      const tqs = tp.includes("?") ? tp.split("?")[1] : "";
      const cp = tp.split("?")[0].replace(/\/+$/, "") || "/";
      const td = await getPageData(cp, sb, tqs);
      const is404 = td.type === "notfound";
      return new Response(is404 ? build404Html(td) : buildHtml(td), {
        status: is404 ? 404 : 200,
        headers: {...corsHeaders, "Content-Type": "text/html; charset=utf-8", "X-Prerender": "true", "X-Prerender-Test": "true", "Cache-Control": "no-store"},
      });
    }

    const rawPath = url.searchParams.get("path") || url.pathname.replace(/^\/functions\/v1\/prerender/, "").replace(/^\/prerender/, "") || "/";
    const qsIdx = rawPath.indexOf("?");
    const queryString = qsIdx >= 0 ? rawPath.slice(qsIdx + 1) : url.search.slice(1);
    let path = qsIdx >= 0 ? rawPath.slice(0, qsIdx) : rawPath;
    path = path.replace(/\/+$/, "") || "/";

    // Sitemaps (served to all)
    if (path === "/sitemap.xml") return new Response(smIndex(), {headers:{...corsHeaders,...SH}});
    if (path === "/sitemap-pages.xml") return new Response(smPages(), {headers:{...corsHeaders,...SH}});
    if (path === "/sitemap-guides.xml") return new Response(smGuides(), {headers:{...corsHeaders,...SH}});
    if (path === "/sitemap-materials.xml") return new Response(smPages(), {headers:{...corsHeaders,...SH}});

    // Guide redirects
    if (GUIDE_REDIRECTS[path]) return new Response(null, {status:301, headers:{...corsHeaders,Location:GUIDE_REDIRECTS[path],"Cache-Control":"public, max-age=86400"}});

    // DB-backed sitemaps or crawler prerender
    const needsDb = ["/sitemap-filaments.xml","/sitemap-brands.xml","/sitemap-printers.xml","/sitemap-colors.xml"].includes(path);
    if (needsDb || isCrawler(ua)) {
      const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      if (path === "/sitemap-filaments.xml") return new Response(await smFilaments(sb), {headers:{...corsHeaders,...SH}});
      if (path === "/sitemap-brands.xml") return new Response(await smBrands(sb), {headers:{...corsHeaders,...SH}});
      if (path === "/sitemap-printers.xml") return new Response(await smPrinters(sb), {headers:{...corsHeaders,...SH}});
      if (path === "/sitemap-colors.xml") return new Response(await smColors(sb), {headers:{...corsHeaders,...SH}});
      
      console.log(`[PRERENDER] crawler="${ua}" path="${path}"`);
      const pd = await getPageData(path, sb, queryString);
      const is404 = pd.type === "notfound";
      return new Response(is404 ? build404Html(pd) : buildHtml(pd), {
        status: is404 ? 404 : 200,
        headers: {...corsHeaders, "Content-Type": "text/html; charset=utf-8", "X-Prerender": "true",
          "Cache-Control": is404 ? "public, max-age=60" : "public, max-age=3600, s-maxage=3600",
          "X-Robots-Tag": is404 ? "noindex" : "all"},
      });
    }

    // Non-crawler → redirect to SPA
    return new Response(null, {status:302, headers:{...corsHeaders,Location:`${BASE_URL}${path}`}});
  } catch (err) {
    console.error("Prerender error:", err);
    return new Response("Internal Server Error", {status:500, headers:corsHeaders});
  }
});
