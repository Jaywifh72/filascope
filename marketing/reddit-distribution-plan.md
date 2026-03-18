# FilaScope Reddit & Community Distribution Plan

Last updated: 2026-03-18

---

## Target Communities

### Reddit (Primary)
| Subreddit | Members | Strategy | Post Frequency |
|---|---|---|---|
| r/3Dprinting | 2M+ | Helpful comments linking FilaScope as data source | 3-5x/week |
| r/BambuLab | 200K+ | P1S/A1/X1C filament recommendations | 2x/week |
| r/prusa3d | 100K+ | MK4/XL filament compatibility tips | 1-2x/week |
| r/FixMyPrint | 150K+ | Troubleshooting with filament data links | 2-3x/week |
| r/functionalprint | 100K+ | Material recommendations for functional parts | 1x/week |
| r/3dprintingdeal | 50K+ | Link to /deals page when relevant | As deals appear |

### HueForge-Specific
| Platform | Strategy |
|---|---|
| r/HueForge | Share TD database as community resource |
| HueForge Discord | Pin request for TD database link |
| HueForge Facebook Group | Share TD lookup tool |
| HueForge Wiki | Request inclusion as TD resource |

### YouTube / Content Creators
| Creator | Relevance | Outreach Angle |
|---|---|---|
| 3D printing channels (Teaching Tech, CNC Kitchen, etc.) | Filament reviews | Offer data embeds or fact-checking resource |
| HueForge-focused creators | TD values | Offer as THE TD reference database |

---

## Reddit Post Templates

### Template 1: TD Database Announcement (r/3Dprinting, r/HueForge)

**Title:** I built a free HueForge TD database with 500+ filaments — no more guessing TD values

**Body:**
```
Hey everyone,

I've been building FilaScope (https://filascope.com/hueforge-td-database), a free tool that tracks HueForge Transmission Distance (TD) values for 500+ filaments from 49+ brands.

**What it does:**
- Search TD values by brand, color, or material
- Filter by TD range (find all filaments between TD 2-4, for example)
- See which filaments are verified vs community-reported
- Compare TD values across brands for the same color

**Why I built it:**
Every time someone asks "what's the TD for [filament X]?" the answer is usually "check the spreadsheet" or "measure it yourself." I wanted one searchable database with everything in one place.

It's completely free, no account needed. I'd love feedback on what's missing or what would make it more useful.

Link: https://filascope.com/hueforge-td-database
```

---

### Template 2: "Which filament?" Helper Comment

**Context:** Reply to posts asking "What filament should I buy for [use case]?"

```
For [use case], you'd want [material type] filament. Based on the data I track at FilaScope (https://filascope.com/filaments/[material]), the top-rated options are:

1. **[Brand] [Product]** — [key reason, e.g., "best surface finish, ±0.02mm tolerance"]
2. **[Brand] [Product]** — [key reason, e.g., "best value at $16/kg"]
3. **[Brand] [Product]** — [key reason, e.g., "widest temp range, very forgiving"]

You can compare them side by side here: https://filascope.com/compare

[If relevant: The buying guide breaks down the full top 10: https://filascope.com/guides/best-[material]-filaments]
```

---

### Template 3: Printer-Specific Recommendation (r/BambuLab, r/prusa3d)

**Title:** Data-driven filament picks for the [Printer Model] — tested across 1,080+ filaments

**Body:**
```
I maintain a filament database (FilaScope) that tracks 1,080+ filaments from 49+ brands. Here's what the data shows for [Printer Model] owners:

**Best overall PLA:** [Product] — [reason]
**Best for speed:** [Product] — [reason, e.g., "handles 300mm/s on the P1S without quality loss"]
**Best PETG:** [Product] — [reason]
**Best budget option:** [Product] — [price point]

Full guide with all the data: https://filascope.com/guides/best-filament-for-[printer-slug]

The guide pulls live pricing from 15+ retailers so you can see current prices in your region.

What filament have YOU had the best results with on your [Printer]?
```

---

### Template 4: Price Drop Alert (r/3dprintingdeal)

**Title:** [Brand] [Product] dropped to $X/kg — lowest price tracked on FilaScope

**Body:**
```
FilaScope's price tracker flagged this: [Brand] [Product] is currently at $X/kg on [Store], down from the usual $Y/kg.

- Material: [PLA/PETG/etc.]
- Current price: $X ([Store link])
- Price history: This is the lowest we've tracked since [date]

You can set up price alerts on FilaScope to catch drops like this: https://filascope.com/deals
```

---

### Template 5: Material Comparison (r/3Dprinting)

**Title:** PLA vs PETG vs ABS — I compared the data across 1,080+ filaments. Here's what actually matters.

**Body:**
```
I run FilaScope, a filament comparison database with 1,080+ products. Here's what the aggregate data shows across all three materials:

**PLA (4,296 variants tracked)**
- Avg price: $18-22/kg
- Temp range: 190-220°C nozzle, 25-60°C bed
- Best for: Decorative prints, prototypes, beginners
- Weakness: Brittle, low heat resistance

**PETG (1,048 variants tracked)**
- Avg price: $20-25/kg
- Temp range: 220-250°C nozzle, 70-80°C bed
- Best for: Functional parts, outdoor (moderate UV)
- Weakness: Stringing, not great surface finish

**ABS (865 variants tracked)**
- Avg price: $18-23/kg
- Temp range: 230-260°C nozzle, 90-110°C bed
- Best for: Heat-resistant parts, automotive
- Weakness: Warping, toxic fumes, requires enclosure

Full comparison with specific product recommendations: https://filascope.com/guides/pla-vs-petg

What material do you reach for most?
```

---

## Posting Guidelines

1. **Be genuinely helpful first.** The link to FilaScope should be supplementary, not the point of the post.
2. **Don't spam.** Maximum 1 self-promotional post per subreddit per week. Comment replies with links are fine more often if they're genuinely answering someone's question.
3. **Engage in comments.** Reply to every comment on your posts. This boosts visibility and builds trust.
4. **Use data, not marketing speak.** "1,080+ filaments tracked" is credible. "The best filament tool ever" is not.
5. **Disclose your connection.** If directly asked, always say "I built/maintain FilaScope." Most subreddits appreciate honesty.
6. **Adapt to the subreddit culture.** r/3Dprinting is casual. r/functionalprint is more technical. Match the tone.
7. **Post at peak times.** US mornings (9-11am EST) on weekdays, or Saturday/Sunday mornings for maximum visibility.

---

## HueForge Community Outreach Template

**For Discord/Facebook groups:**

```
Hi everyone! I've been building a free HueForge TD database that currently covers 500+ filaments from 49+ brands:

https://filascope.com/hueforge-td-database

You can:
- Search by brand, color, or material
- Filter by TD range
- See verified vs community-reported values
- Find substitute filaments with similar TD values

I'd love to get this added as a community resource if it's useful. Also happy to add any TD values you've measured that aren't in the database yet — just share them here or DM me.

Feedback welcome!
```

---

## YouTube Outreach Template

**Subject: Free filament data for your reviews**

```
Hi [Creator Name],

I run FilaScope (filascope.com), a filament comparison database with 1,080+ products, live pricing, and the largest public HueForge TD database.

I noticed you review filaments regularly and wanted to offer our data as a resource:

- Embed our comparison widgets in your video descriptions
- Reference our TD values for HueForge content
- Use our price tracking data in buying guides

No sponsorship ask — just offering the data. Let me know if any of this would be useful for your content.

Best,
[Name]
```

---

## Tracking & KPIs

| Metric | Tool | Target |
|---|---|---|
| Reddit referral traffic | Google Analytics UTM | 500+ visits/month within 3 months |
| Discord/FB referral traffic | GA UTM | 200+ visits/month |
| r/3Dprinting post engagement | Reddit | 50+ upvotes on announcement post |
| Backlinks from community resources | Ahrefs/GSC | 5+ .com backlinks within 6 months |
| HueForge wiki inclusion | Manual check | Listed within 1 month |
