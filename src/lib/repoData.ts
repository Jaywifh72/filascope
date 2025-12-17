export interface RepoStrength {
  title: string;
  description: string;
}

export interface RepoWeakness {
  title: string;
  description: string;
}

export interface RepoData {
  id: string;
  name: string;
  owner: string;
  status: string;
  primaryModel: string;
  summary: string;
  strategicPositioning: string;
  businessModel: string;
  technicalArchitecture: string;
  community: string;
  strengths: RepoStrength[];
  weaknesses: RepoWeakness[];
  bottomLine: string;
  bestFor: string[];
  notIdealFor: string[];
  links: {
    website?: string;
    app?: string;
  };
}

export const repoData: RepoData[] = [
  {
    id: "makerworld",
    name: "MakerWorld",
    owner: "Bambu Lab",
    status: "The Ecosystem Disruptor",
    primaryModel: "Loss-Leader Ecosystem Integration",
    summary: "MakerWorld represents the most aggressive evolution of the 3D model repository. Unlike its predecessors, which functioned as passive archives, MakerWorld acts as an active bridge between digital files and physical output. Owned by Bambu Lab, the platform is engineered to reduce the friction of 3D printing to near-zero, specifically for users of its own hardware.",
    strategicPositioning: "The platform's meteoric rise is attributed to its \"Print Profile\" system. Traditional repositories host STL files—\"dumb\" geometry that requires user skill to slice and process. MakerWorld prioritizes 3MF files containing pre-sliced settings, orientation data, support structures, and filament parameters. This shifts the technical burden from the user to the creator, democratizing access to high-success printing but simultaneously creating a dependency on Bambu's proprietary slicer, Bambu Studio.",
    businessModel: "MakerWorld operates on a \"loss-leader\" strategy. The platform generates no direct revenue from file sales for the majority of users. Instead, it serves as a marketing engine for Bambu Lab's hardware and consumables. The economy is built on \"points\"—designers earn points based on model popularity which are redeemable for Bambu Lab printers, AMS units, filament, and gift cards. \"Maker's Supply\" allows creators to link designs to hardware kits sold by Bambu Lab, earning commissions. A Commercial License Membership tier allows creators to sell commercial licenses.",
    technicalArchitecture: "MakerWorld is the primary driver behind the industry's shift from STL to 3MF (3D Manufacturing Format). The platform's architecture parses 3MF files to extract metadata regarding slicing parameters, validated against specific printer profiles via cloud simulation. Cloud slicing allows users to initiate prints directly from the Bambu Handy mobile app without a desktop computer. The Exclusive Model Program incentivizes designers to keep models exclusive in exchange for boosted visibility and higher point multipliers.",
    community: "The community culture is defined by high velocity and high competition. The incentives for \"points\" have led to issues with \"points farming,\" where users upload low-effort remixes or stolen content. Bambu Lab has responded with strict algorithmic changes, penalizing low-effort content and rewarding complexity and originality. A significant friction point is the platform's aggressive legal stance on IP, issuing cease-and-desist orders to third-party aggregators.",
    strengths: [
      { title: "One-Click Workflow", description: "Integration with Bambu Studio/Handy app creates the lowest barrier to entry in the industry" },
      { title: "Lucrative Rewards", description: "The points-to-hardware conversion rate is currently the most generous for hobbyist designers" },
      { title: "3MF Standardization", description: "Forces the industry toward a smarter file format that includes process data, reducing print failures" }
    ],
    weaknesses: [
      { title: "Ecosystem Lock-in", description: "Features are heavily biased toward Bambu Lab hardware; non-Bambu users receive a degraded experience" },
      { title: "IP Licensing Conflict", description: "The push for exclusivity and restrictive licenses alienates the open-source community" },
      { title: "Search Spam", description: "The reward incentives encourage flooding results with minor variations and low-quality \"farmed\" content" }
    ],
    bottomLine: "MakerWorld is the fastest path from download to print—if you own a Bambu printer. One-click slicing, automatic settings, and generous creator rewards make it compelling, but you're locked into their ecosystem.",
    bestFor: [
      "Bambu Lab printer owners who want zero-friction workflow",
      "Hobbyists looking for generous creator reward programs",
      "Users who prioritize one-click printing over flexibility"
    ],
    notIdealFor: [
      "Multi-brand printer owners (features are Bambu-optimized)",
      "Designers prioritizing open-source community values",
      "Users who want maximum control over slicing settings"
    ],
    links: {
      website: "https://makerworld.com"
    }
  },
  {
    id: "printables",
    name: "Printables",
    owner: "Prusa Research",
    status: "The Community Benchmark",
    primaryModel: "Open Source Community & Subscription Clubs",
    summary: "Printables stands as the ideological counterweight to MakerWorld. While owned by a hardware manufacturer (Prusa Research), it has successfully positioned itself as a \"brand-agnostic\" haven for the 3D printing community. Its strategic focus is on trust, reliability, and open-source principles.",
    strategicPositioning: "Unlike MakerWorld's aggressive gamification, Printables emphasizes curation and community health, aiming to be the \"quality over quantity\" repository. It is widely regarded as having the superior user interface (UI) and the most effective search engine, free from ad clutter and spam. It serves as the primary hub for serious hobbyists and open-source contributors.",
    businessModel: "Printables utilizes a hybrid model blending a free repository with direct creator monetization tools. Prusameters is a reward system with stricter earning criteria—points awarded for uploading prints (Makes) and models, exchangeable for Prusament filament. Printables Clubs (like Patreon) allows creators to launch subscription tiers ($3-$100/month) with Prusa taking a 10% commission. The Printables Store allows individual model sales.",
    technicalArchitecture: "Printables supports STL, 3MF, and G-code. When users upload pre-sliced G-code, Printables checks the file header to ensure it matches the target printer model. The platform features the industry's most robust \"remix\" linking system, tracking model genealogy to ensure original creators are credited as designs are modified and re-uploaded.",
    community: "The culture is deeply rooted in the RepRap ethos. The community is highly active in reporting spam and enforcing licensing norms. Design contests are a central pillar of engagement, with Prusa sponsoring weekly competitions on specific themes that drive high-quality content creation.",
    strengths: [
      { title: "Community Trust", description: "Highest reputation for ethical conduct, licensing respect, and moderation" },
      { title: "User Experience (UX)", description: "Cleanest, ad-free interface with powerful filters for nozzle size, material, and print time" },
      { title: "Flexible Monetization", description: "\"Clubs\" allows creators to monetize without leaving the platform, with a fair 10% fee" }
    ],
    weaknesses: [
      { title: "Growth Velocity", description: "User acquisition is slower compared to the viral, hardware-bundled growth of MakerWorld" },
      { title: "Revenue Scale", description: "While creator-friendly, total revenue generated for designers is generally lower than on dedicated marketplaces" },
      { title: "Hardware Neutrality", description: "While a strength for users, it lacks the deep \"one-click\" hardware integration that drives engagement on proprietary platforms" }
    ],
    bottomLine: "The gold standard for quality-focused makers. Brand-agnostic, ad-free, and community-driven with the best search and UI in the industry. Prusameters reward quality over quantity.",
    bestFor: [
      "Quality-focused makers who want vetted designs",
      "Open-source advocates and RepRap community members",
      "Creators seeking fair monetization with Clubs subscriptions"
    ],
    notIdealFor: [
      "Users wanting one-click, hardware-integrated printing",
      "Those seeking the absolute largest model library",
      "Designers prioritizing pure marketplace sales over community"
    ],
    links: {
      website: "https://www.printables.com"
    }
  },
  {
    id: "thingiverse",
    name: "Thingiverse",
    owner: "UltiMaker",
    status: "The Legacy Archive",
    primaryModel: "Ad-Supported Free Repository",
    summary: "Thingiverse is the \"Google\" of 3D model repositories—the default starting point for millions due to its massive historical database and SEO dominance. Despite years of technical neglect under MakerBot, and subsequent stabilization efforts under UltiMaker, it remains the largest repository by volume, hosting over 6.7 million models.",
    strategicPositioning: "In 2025, it functions primarily as an archive. While it lacks the modern features of its competitors, its sheer scale makes it indispensable; if a model was made before 2020, it is almost certainly on Thingiverse.",
    businessModel: "Thingiverse is a pure \"free-to-use\" platform monetized through advertising and data. The platform generates revenue through programmatic display ads with a 41% increase in ad revenue following aggressive optimization (sticky footers, interstitial ads). For UltiMaker, Thingiverse serves as a top-of-funnel marketing tool. Uniquely among top platforms, it offers no native monetization for creators beyond a buried \"Tip\" button, causing a massive \"brain drain\" to other platforms.",
    technicalArchitecture: "The platform relies on the legacy STL format. The \"Customizer\" is the defining technical feature—an integrated OpenSCAD compiler allowing users to modify parametric models in the browser. However, this feature is notoriously unstable with frequent queues and rendering failures. The site is plagued by legacy code issues resulting in slow load times, broken zip downloads, and poor search functionality.",
    community: "Thingiverse's community is vast but passive. While download counts are high, engagement (comments, makes) is lower relative to traffic. The platform is the stronghold of the \"everything should be free\" mentality, which creates friction with modern designers seeking compensation.",
    strengths: [
      { title: "Volume & History", description: "The largest library of 3D models in existence; the \"Library of Alexandria\" for 3D printing" },
      { title: "SEO Dominance", description: "Consistently ranks first in Google searches, ensuring a steady stream of new users" },
      { title: "Open API", description: "Allows third-party apps and search engines to index content easily" }
    ],
    weaknesses: [
      { title: "Ad Intrusion", description: "Aggressive advertising significantly degrades the user experience" },
      { title: "Technical Instability", description: "Frequent downtime, broken features (Customizer, Analytics), and slow performance" },
      { title: "Creator Exodus", description: "The lack of monetization capability drives top talent to competing platforms" }
    ],
    bottomLine: "The largest 3D model archive (6.7M+ models) with unmatched SEO reach, but plagued by ads, technical issues, and no creator monetization. Best for finding older, obscure designs.",
    bestFor: [
      "Hobbyists looking for the widest free selection",
      "Users searching for older or obscure designs",
      "Those who prioritize free access over user experience"
    ],
    notIdealFor: [
      "Anyone who values clean, ad-free interfaces",
      "Creators wanting to monetize their work",
      "Users expecting reliable technical performance"
    ],
    links: {
      website: "https://www.thingiverse.com"
    }
  },
  {
    id: "cults3d",
    name: "Cults3D",
    owner: "Independent (France)",
    status: "The Independent Marketplace",
    primaryModel: "Digital Marketplace (Commission Based)",
    summary: "Cults3D identifies explicitly as a marketplace. While it hosts free files, its primary function is to facilitate the sale of high-quality digital assets. It has carved out a lucrative niche in \"artistic\" prints—highly detailed sculptures, cosplay props, fashion accessories, and jewelry.",
    strategicPositioning: "It is the platform of choice for designers who view themselves as independent merchants rather than community contributors. The platform focuses on visual presentation for high-polygon ZBrush sculpts and artistic prints users are willing to pay for.",
    businessModel: "Cults3D operates on a straightforward commission structure: 20% commission on sales, leaving 80% for the designer—one of the most favorable splits in the industry. Designers have complete pricing control, with the platform encouraging micro-transactions ($2-$10) driving high volume sales. The platform's reputation carries a permanent stain from a 2021 doxxing incident, though they have since improved with automated payouts.",
    technicalArchitecture: "Cults3D supports STL, OBJ, and 3MF. It is less focused on cloud slicing or printer integration and more on visual presentation. In a forward-thinking move, Cults3D introduced a specific \"No AI\" license option allowing creators to explicitly forbid their files from being used to train generative AI models.",
    community: "The culture is transactional. Interaction revolves around sales, customer support for prints, and requests. It has a high concentration of professional designers. However, the platform is criticized for being a haven for \"ripped\" content where users re-upload free files to sell them.",
    strengths: [
      { title: "Revenue Generation", description: "Proven ability to generate significant income for designers; high conversion rates on trends" },
      { title: "Favorable Commission", description: "The 80/20 split is highly competitive for an established marketplace" },
      { title: "AI Protection", description: "Strong stance against AI scraping attracts high-level digital sculptors" }
    ],
    weaknesses: [
      { title: "Trust Deficit", description: "Past doxxing and payment scandals continue to alienate a segment of the community" },
      { title: "IP Infringement", description: "Persistent issues with users selling stolen/remixed content without permission" },
      { title: "Ad Clutter", description: "The interface for free users is heavily populated with ads" }
    ],
    bottomLine: "The independent marketplace with the best creator commission (80/20 split). Strong for artistic prints and sculptures, but past trust issues and IP concerns persist.",
    bestFor: [
      "Designers who want to sell with best commission rates",
      "Artists creating sculptures, cosplay, and jewelry",
      "Users willing to pay for high-quality artistic prints"
    ],
    notIdealFor: [
      "Users prioritizing free content only",
      "Those concerned about platform trust/history",
      "Makers seeking functional or engineering parts"
    ],
    links: {
      website: "https://cults3d.com"
    }
  },
  {
    id: "myminifactory",
    name: "MyMiniFactory",
    owner: "MyMiniFactory (UK)",
    status: "The Premium Curator",
    primaryModel: "Specialized Ecosystem & Crowdfunding",
    summary: "MyMiniFactory differentiates itself through curation and specialization. It is not a generalist repository; it is the definitive hub for tabletop gaming, RPG miniatures, and high-fidelity fan art. MMF guarantees that every object uploaded is \"print-tested,\" ensuring quality control that eliminates non-manifold mesh frustrations.",
    strategicPositioning: "In 2025, it functions as a comprehensive vertical economy for the tabletop industry. The \"Guaranteed Printable\" promise is the gold standard for reliability, attracting users willing to pay for content because of this assurance.",
    businessModel: "MMF has developed the most diversified monetization tools. Tribes (like Patreon) is an integrated subscription system. FronTiers is a native crowdfunding platform for STL collections. The Premium Merchant Program ($25/month) verifies physical manufacturers, creating a licensed supply chain where makers can sell physical prints with automatic royalty tracking. Store fees are 10-15% depending on subscription tier (Studio/Pro, up to $99/month).",
    technicalArchitecture: "MMF focuses on STL and OBJ assets optimized for resin printing. \"Click & Print\" is a plugin for OctoPrint allowing verified, pre-sliced G-code to be streamed directly to printers, removing the slicer from the workflow entirely for certified content.",
    community: "The community is tight-knit and focused on painting and gaming. The \"Scan the World\" initiative, hosted on MMF, is the largest archive of 3D scanned cultural artifacts, adding educational and academic dimensions.",
    strengths: [
      { title: "Quality Assurance", description: "The \"Guaranteed Printable\" standard is the gold standard for reliability" },
      { title: "Monetization Tools", description: "Tribes and FronTiers provide a complete business operating system for professional designers" },
      { title: "Licensing Infrastructure", description: "The Premium Merchant program solves the \"Etsy problem\" for IP holders" }
    ],
    weaknesses: [
      { title: "High Costs", description: "Monthly subscription fees for sellers (up to $99) create a high barrier to entry" },
      { title: "Niche Focus", description: "Less relevant for users seeking functional, engineering, or mechanical parts" },
      { title: "Platform Fees", description: "Transaction fees on top of subscriptions can reduce margins for smaller creators" }
    ],
    bottomLine: "The premium curator for tabletop gaming and miniatures. Every model is 'Guaranteed Printable,' but subscription fees and niche focus limit broader appeal.",
    bestFor: [
      "Tabletop gamers and miniature collectors",
      "Users who value guaranteed-printable quality",
      "Professional designers using Tribes/FronTiers monetization"
    ],
    notIdealFor: [
      "Hobbyists seeking free or budget content",
      "Users wanting functional/mechanical parts",
      "Small creators unable to afford subscription fees"
    ],
    links: {
      website: "https://www.myminifactory.com"
    }
  },
  {
    id: "thangs",
    name: "Thangs",
    owner: "Physna",
    status: "The Geometric Search Engine",
    primaryModel: "Search Aggregation & AI Tools",
    summary: "Thangs entered the market not just as a repository but as a search engine. Its core technology is a geometric deep-learning algorithm that indexes 3D models based on their shape, not just text tags. This allows Thangs to find a model (and its remixes/duplicates) across the entire web.",
    strategicPositioning: "Thangs has pivoted to becoming a destination platform with its own exclusive content and collaboration tools. It is arguably the most technically advanced platform regarding file support, with the unmatched ability to find files based on shape.",
    businessModel: "Thangs monetizes through advanced subscription bundles and enterprise B2B search technology. The \"Thangs Bundle\" ($14.99/month) grants access to premium models from multiple top creators—instead of paying $10 to five different designers, users pay one fee for a rotating catalog. Creators can run individual membership programs. The underlying Physna technology is sold to industrial clients for internal part sourcing.",
    technicalArchitecture: "Users can upload a 3D model to find similar parts, effectively \"Googling with geometry.\" Thangs supports over 30 file formats, including native CAD formats like STEP, Parasolid, and SLDPRT, as well as USDZ, GLB, and FBX. Its browser-based viewer handles complex assemblies and AR previews. \"Workspace\" offers version control and team access, positioning Thangs as \"GitHub for 3D.\"",
    community: "The platform often serves as a pass-through to find models hosted elsewhere, which limits deep engagement. However, the Bundle subscription and exclusive content are attracting more dedicated users.",
    strengths: [
      { title: "Geometric Search", description: "Unmatched ability to find files based on shape, exposing duplicates and remixes" },
      { title: "File Compatibility", description: "Native support for CAD and assembly files makes it superior for technical users" },
      { title: "Value Bundling", description: "The \"Bundle\" subscription offers high value for users who want premium models without managing multiple subs" }
    ],
    weaknesses: [
      { title: "Identity Crisis", description: "Balances awkwardly between being a search engine (directing traffic away) and a repository (keeping traffic)" },
      { title: "Download Caps", description: "Bundle subscriptions have download limits (e.g., 15/week), frustrating power users" },
      { title: "User Retention", description: "Often used as a pass-through to find models hosted elsewhere, limiting deep engagement" }
    ],
    bottomLine: "The geometric search engine that finds models by shape, not just keywords. Aggregates content across platforms with excellent CAD format support, but identity crisis limits engagement.",
    bestFor: [
      "Users who know what shape they want but not its name",
      "Engineers needing native CAD format support (30+ formats)",
      "Those wanting one subscription for multiple creators"
    ],
    notIdealFor: [
      "Users wanting deep community engagement",
      "Power users frustrated by download caps",
      "Those seeking a dedicated repository vs. search engine"
    ],
    links: {
      website: "https://thangs.com"
    }
  },
  {
    id: "creality-cloud",
    name: "Creality Cloud",
    owner: "Creality",
    status: "The Mobile Ecosystem",
    primaryModel: "Mobile Subscription & Hardware Lock-in",
    summary: "Creality Cloud is the mobile-first counterpart to MakerWorld, serving the massive install base of Ender and CR-series printers. It is an all-in-one platform integrating a file repository, cloud slicer, and remote printer control into a single mobile app.",
    strategicPositioning: "Its strategy is accessibility: allowing users with no CAD skills or powerful PCs to slice and print from a phone. It is the only viable option for \"phone-to-print\" workflows without a PC.",
    businessModel: "The platform is heavily monetized through subscriptions and ads. Premium Membership (~$79.99/year) unlocks essential features like fast download speeds, priority cloud slicing, and increased storage. Free users face throttled speeds and wait times for cloud processing. A model marketplace exists for selling models, though less lucrative than Cults or MMF. The free tier is laden with ads.",
    technicalArchitecture: "Creality Cloud focuses on G-code generation and delivery. A unique feature is encrypted slicing where models are sliced in the cloud and streamed to the printer without the user ever accessing the source geometry—protecting designer IP. The built-in mobile slicer is optimized for touch interfaces.",
    community: "The library is often flooded with untested or stolen content due to lax moderation. The app is cluttered with social features, gamification, and ads that distract from utility.",
    strengths: [
      { title: "Mobile Integration", description: "The only viable option for \"phone-to-print\" workflows without a PC" },
      { title: "Massive Reach", description: "Pre-installed audience of millions of Ender users provides instant traffic" },
      { title: "IP Protection", description: "Encrypted streaming offers protection against file sharing not found elsewhere" }
    ],
    weaknesses: [
      { title: "Pay-to-Win", description: "Basic functionality (speed, slicing) is gated behind a paywall, creating a poor experience for free users" },
      { title: "Quality Control", description: "The library is often flooded with untested or stolen content due to lax moderation" },
      { title: "Bloated UI", description: "The app is cluttered with social features, gamification, and ads, distracting from utility" }
    ],
    bottomLine: "The only viable phone-to-print solution with massive Ender user reach. Mobile-first approach is convenient, but pay-to-win model and quality issues frustrate users.",
    bestFor: [
      "Creality printer owners wanting mobile workflow",
      "Users without access to a desktop computer",
      "Those wanting encrypted IP protection for prints"
    ],
    notIdealFor: [
      "Users expecting quality free-tier experience",
      "Anyone frustrated by ads and bloated UI",
      "Makers seeking curated, tested content"
    ],
    links: {
      website: "https://www.crealitycloud.com",
      app: "https://www.crealitycloud.com/download"
    }
  },
  {
    id: "grabcad",
    name: "GrabCAD",
    owner: "Stratasys",
    status: "The Engineer's Vault",
    primaryModel: "Free Community Library & Enterprise Lead Gen",
    summary: "GrabCAD occupies the professional engineering niche. Owned by Stratasys, it avoids the \"trinket\" market entirely, focusing on CAD models, industrial assemblies, and engineering components. It serves as a lead generation tool for Stratasys' industrial software and hardware ecosystem.",
    strategicPositioning: "GrabCAD is the stronghold of NURBS data. Unlike the mesh-based STL world, GrabCAD hosts STEP, IGES, SLDPRT, and Parasolid files, making it essential for professional engineers and industrial users.",
    businessModel: "The Community Library is free. Revenue is generated through GrabCAD Print (advanced slicing software for Stratasys industrial printers), GrabCAD Shop (paid workflow management for professional 3D printing labs), and enterprise sales funneling users toward Stratasys industrial hardware.",
    technicalArchitecture: "GrabCAD hosts STEP, IGES, SLDPRT, and Parasolid files—NURBS data rather than mesh-based STLs. Recent updates to GrabCAD Print have added robust 3MF support, allowing full-color and multi-material data to be imported from CAD software like SolidWorks directly into the print environment.",
    community: "The community is professional and engineering-focused. Users tend to be industrial designers, mechanical engineers, and students learning CAD software. The platform serves educational institutions extensively.",
    strengths: [
      { title: "Engineering Focus", description: "The definitive source for native CAD files, industrial assemblies, and engineering components" },
      { title: "Professional Quality", description: "Content is curated toward functional, manufacturable parts rather than decorative prints" },
      { title: "3MF Integration", description: "Recent updates bridge the gap between CAD design and additive manufacturing" }
    ],
    weaknesses: [
      { title: "Industrial Bias", description: "Not useful for hobbyists seeking consumer-oriented models or artistic prints" },
      { title: "Stratasys Lock-in", description: "GrabCAD Print is optimized for Stratasys hardware, limiting utility for other printer owners" },
      { title: "Limited Monetization", description: "No creator monetization tools; serves primarily as a free resource" }
    ],
    bottomLine: "The engineer's vault for professional CAD files (STEP, IGES, Parasolid). Essential for industrial users but irrelevant for hobbyist makers seeking decorative prints.",
    bestFor: [
      "Professional engineers and industrial designers",
      "Students learning CAD software",
      "Users needing native CAD formats for manufacturing"
    ],
    notIdealFor: [
      "Hobbyists seeking consumer-oriented models",
      "Makers wanting artistic or decorative prints",
      "Creators looking to monetize their designs"
    ],
    links: {
      website: "https://grabcad.com"
    }
  }
];
