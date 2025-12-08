// Brand information and summaries
export interface BrandInfoData {
  summary: string;
  founded?: string;
  location?: string;
  companyType?: 'public' | 'private' | 'subsidiary' | 'open-source';
  stockTicker?: string;
  stockExchange?: string;
  parentCompany?: string;
  subsidiaries?: string[];
  headquarters?: string;
  ceo?: string;
  president?: string;
  founder?: string;
  employees?: string;
  website?: string;
  revenue?: string;
}

export const brandInfo: Record<string, BrandInfoData> = {
  "Bambu Lab": {
    summary: "Bambu Lab is a revolutionary force in the 3D printing industry, founded in 2021 by a team of former DJI engineers in Shenzhen, China. The company emerged with a clear mission to make 3D printing accessible, reliable, and intelligent for both hobbyists and professionals. Their flagship product, the Bambu Lab X1 Carbon, quickly became a game-changer in the market, featuring advanced AI-powered features, multi-color printing capabilities, and exceptional print speeds.\n\nThe company's innovative approach integrates cutting-edge technology with user-friendly design, offering features like automatic calibration, remote monitoring through their mobile app, and a sophisticated ecosystem that includes their AMS (Automatic Material System) for seamless multi-color printing. Bambu Lab has achieved remarkable success by addressing long-standing pain points in desktop 3D printing, including reliability issues and complex setup procedures.\n\nTheir P1 and A1 series printers have expanded their product line to serve different market segments while maintaining their commitment to quality and innovation. The company has built a thriving community of users who appreciate their commitment to continuous software updates and feature improvements. Bambu Lab's success is evidenced by their rapid market penetration and strong customer loyalty, establishing them as a leading innovator in the consumer and professional 3D printing space within just a few years of operation.",
    location: "Shenzhen, China",
    founded: "2021",
    companyType: "private",
    headquarters: "Shenzhen, Guangdong Province, China",
    founder: "Dr. Tao Ye (former DJI executive)",
    employees: "500+",
    website: "https://bambulab.com"
  },
  "Overture": {
    summary: "Overture 3D is a prominent filament manufacturer based in China, dedicated to providing high-quality, affordable 3D printing materials to makers worldwide. The company has built its reputation on delivering consistent filament quality while maintaining competitive pricing, making 3D printing more accessible to hobbyists and professionals alike. Overture's flagship products include their popular PLA and PETG filament lines, which have garnered widespread acclaim for their excellent dimensional accuracy and consistent color quality.\n\nThe company operates with a customer-first philosophy, actively engaging with the 3D printing community to understand their needs and continuously improve their products. Their commitment to quality control is evident in their rigorous testing procedures, ensuring each spool meets exacting standards for diameter tolerance and material purity. Overture has achieved significant success in the competitive filament market by focusing on reliability and value, making them a favorite among budget-conscious makers who refuse to compromise on quality.\n\nThe company offers an extensive color palette across their product lines, enabling creative freedom for users. Their filaments are compatible with a wide range of 3D printers, demonstrating versatility that appeals to diverse user needs. Overture has also earned recognition for their excellent customer service and responsive support team. As they continue to expand their product offerings and global distribution network, Overture remains committed to democratizing 3D printing through affordable, high-quality materials.",
    location: "China",
    founded: "2017",
    companyType: "private",
    headquarters: "Shenzhen, Guangdong Province, China",
    website: "https://overture3d.com"
  },
  "Overture 3D": {
    summary: "Overture 3D is a prominent filament manufacturer based in China, dedicated to providing high-quality, affordable 3D printing materials to makers worldwide. The company has built its reputation on delivering consistent filament quality while maintaining competitive pricing, making 3D printing more accessible to hobbyists and professionals alike. Overture's flagship products include their popular PLA and PETG filament lines, which have garnered widespread acclaim for their excellent dimensional accuracy and consistent color quality.\n\nThe company operates with a customer-first philosophy, actively engaging with the 3D printing community to understand their needs and continuously improve their products. Their commitment to quality control is evident in their rigorous testing procedures, ensuring each spool meets exacting standards for diameter tolerance and material purity. Overture has achieved significant success in the competitive filament market by focusing on reliability and value, making them a favorite among budget-conscious makers who refuse to compromise on quality.\n\nThe company offers an extensive color palette across their product lines, enabling creative freedom for users. Their filaments are compatible with a wide range of 3D printers, demonstrating versatility that appeals to diverse user needs. Overture has also earned recognition for their excellent customer service and responsive support team. As they continue to expand their product offerings and global distribution network, Overture remains committed to democratizing 3D printing through affordable, high-quality materials.",
    location: "China",
    founded: "2017",
    companyType: "private",
    headquarters: "Shenzhen, Guangdong Province, China",
    website: "https://overture3d.com"
  },
  "3DXTech": {
    summary: "3DXTech is a leading American manufacturer of high-performance 3D printing filaments, headquartered in Grand Rapids, Michigan. Founded by engineers passionate about advancing additive manufacturing, the company has established itself as a premier supplier of specialty and engineering-grade filaments. Their roots in industrial manufacturing inform their approach to material development, resulting in filaments that meet demanding professional applications.\n\n3DXTech's flagship products include their CarbonX line of carbon fiber reinforced materials and FibreX composite filaments, which deliver exceptional strength-to-weight ratios for functional parts. The company has achieved notable success in serving industries including aerospace, automotive, and manufacturing, where material performance is critical. Their commitment to American manufacturing ensures consistent quality and supports local jobs.\n\n3DXTech invests heavily in research and development, continuously pushing the boundaries of what's possible with FDM printing. Their materials undergo rigorous testing to provide detailed technical data sheets, giving engineers confidence in part performance. The company also offers custom material development services, working with clients to create specialized formulations for unique applications. As additive manufacturing continues to evolve, 3DXTech remains at the forefront, developing next-generation materials that enable new possibilities.",
    location: "Grand Rapids, Michigan, USA",
    founded: "2014",
    companyType: "private",
    headquarters: "3219 Broadmoor Ave SE, Grand Rapids, MI 49512, USA",
    website: "https://www.3dxtech.com"
  },
  "Filamentum": {
    summary: "Filamentum is a prestigious European filament manufacturer based in the Czech Republic, renowned for their exceptional quality and vibrant color offerings. Founded with a vision to create premium 3D printing materials, the company has established itself as a leader in the European market and beyond. Filamentum's manufacturing facility in Hulín combines traditional European craftsmanship with modern production techniques, ensuring every spool meets exacting quality standards.\n\nTheir flagship Extrafill line showcases an extensive palette of precisely formulated colors, with exceptional consistency and finish quality that appeals to both professionals and enthusiasts. The company has achieved remarkable success by focusing on material science and color development, creating unique shades that stand out in the market. Filamentum's commitment to sustainability is evident in their environmentally conscious production practices and recyclable packaging.\n\nTheir Crystal Clear PLA has become particularly celebrated for its transparency and clarity, setting a benchmark in the industry. The company's technical materials line includes innovative formulations like their biodegradable Nylon and specialty composites that deliver professional-grade performance. Filamentum has earned numerous awards for their quality and innovation, establishing their reputation as a premium brand. As they continue to grow, Filamentum remains dedicated to pushing the boundaries of filament quality and color science.",
    location: "Hulín, Czech Republic",
    founded: "2013",
    companyType: "private",
    headquarters: "Hulín, Czech Republic",
    website: "https://filamentum.cz"
  },
  "Amolen": {
    summary: "Amolen is an innovative 3D printing filament brand that has rapidly gained recognition for delivering quality materials at accessible price points. Based in China with global distribution, Amolen has built a strong presence in the maker community through their commitment to consistency and value. The company's founders recognized the need for reliable, affordable filaments that don't compromise on performance, and this vision drives their product development.\n\nAmolen's flagship PLA and PETG lines have earned praise for their excellent dimensional accuracy and smooth printing characteristics. The company has achieved impressive growth by focusing on customer satisfaction and responsive service, building a loyal following among hobbyists and small businesses. Their color selection includes both standard and specialty options, providing creative flexibility for diverse projects.\n\nAmolen invests in quality control systems that ensure consistent diameter tolerances and material purity across all spools. The company has successfully positioned itself in the competitive mid-range market segment, offering premium quality at moderate prices. Their packaging includes vacuum-sealed bags with desiccant, demonstrating attention to material preservation. Amolen actively engages with the 3D printing community through social media and customer forums, gathering feedback to refine their offerings.",
    location: "China",
    companyType: "private",
    headquarters: "Shenzhen, Guangdong Province, China",
    website: "https://amolen.com"
  },
  "FormFutura": {
    summary: "FormFutura is a distinguished Dutch filament manufacturer that has earned international recognition for their premium materials and innovative formulations. Founded in Nijmegen, Netherlands, the company represents the best of European engineering and quality standards. FormFutura's roots lie in a deep passion for 3D printing and material science, driving them to develop some of the most advanced filaments available.\n\nTheir flagship EasyFil line showcases their expertise in creating user-friendly materials that deliver professional results without complicated settings. The company has achieved remarkable success with specialty materials, including their ReForm recycled filaments and innovative Galaxy PLA with stunning visual effects. FormFutura's commitment to sustainability sets them apart, with several product lines incorporating recycled materials without compromising performance.\n\nTheir HDglass line has become particularly renowned for delivering crystal-clear prints with excellent mechanical properties. The company maintains rigorous quality control throughout their production process, ensuring consistent diameter and material properties. FormFutura provides comprehensive technical support and detailed printing guidelines, empowering users to achieve optimal results. They continue to innovate, regularly introducing new materials that address evolving market needs while maintaining their commitment to European quality standards.",
    location: "Nijmegen, Netherlands",
    founded: "2012",
    companyType: "private",
    headquarters: "Nijmegen, Netherlands",
    website: "https://formfutura.com"
  },
  "Taulman3D": {
    summary: "Taulman3D is a pioneering American manufacturer specializing in engineering-grade nylon filaments, based in Missouri, USA. Founded by materials expert Tom Taulman, the company has become synonymous with high-performance nylon materials for 3D printing. Their deep roots in material science and polymer chemistry have positioned them as industry leaders in developing advanced filament formulations.\n\nTaulman3D's flagship product, the iconic Nylon 618, revolutionized desktop 3D printing by bringing industrial-grade nylon to consumer machines. The company has achieved legendary status among makers and professionals who require exceptional strength, flexibility, and durability in their prints. Their extensive nylon portfolio includes specialized formulations for different applications, from the clear Nylon 230 to the bridge-building capable Alloy 910.\n\nTaulman3D's commitment to American manufacturing ensures consistent quality and supports domestic production. Their technical expertise is unmatched, with detailed material specifications and printing guidance that help users achieve success with challenging materials. The company actively collaborates with the maker community, taking feedback seriously and continuously refining formulations. Taulman3D continues to push boundaries in polymer development, exploring new formulations that expand what's possible with FDM technology.",
    location: "Missouri, USA",
    companyType: "private",
    founder: "Tom Taulman",
    headquarters: "St. Louis, Missouri, USA",
    website: "https://taulman3d.com"
  },
  "Ultimaker": {
    summary: "Ultimaker is a globally renowned 3D printing company headquartered in Utrecht, Netherlands, with offices across Europe and the United States. Founded in 2011 by Martijn Elserman, Erik de Bruijn, and Siert Wijnia, the company emerged from the open-source RepRap community with a vision to make professional 3D printing accessible. In 2022, Ultimaker merged with MakerBot to form a new entity, with Stratasys later acquiring a majority stake.\n\nUltimaker's flagship products include their industry-leading Ultimaker S-series and Method series printers, which have set benchmarks for reliability and print quality in professional environments. The company has achieved extraordinary success in the enterprise and education sectors, with their printers deployed in thousands of businesses, schools, and design studios worldwide. Ultimaker's comprehensive ecosystem includes not only exceptional hardware but also their own line of premium filaments engineered specifically for optimal performance with their printers.\n\nThe company revolutionized workflow with Ultimaker Cura, their free, open-source slicing software that has become the industry standard, used by millions globally. Ultimaker's commitment to the open-source community continues through their active development and sharing of innovations. The company's dedication to reliability has made their printers the choice for mission-critical applications across industries.",
    location: "Utrecht, Netherlands",
    founded: "2011",
    companyType: "subsidiary",
    parentCompany: "Stratasys (NASDAQ: SSYS)",
    founder: "Martijn Elserman, Erik de Bruijn, Siert Wijnia",
    headquarters: "Watermolenweg 2, 4191 PN Geldermalsen, Netherlands",
    website: "https://ultimaker.com"
  },
  "Siraya Tech": {
    summary: "Siraya Tech is an innovative manufacturer specializing in high-performance resin materials for SLA and DLP 3D printing, with operations based in California and manufacturing in Asia. The company was founded by materials scientists dedicated to advancing resin printing technology and making professional-grade materials accessible to makers. Siraya Tech's flagship products include their acclaimed Fast, Blu, and Tenacious resins, which have become favorites among resin printing enthusiasts for their excellent mechanical properties and printability.\n\nThe company has achieved rapid success by focusing on formulation chemistry that delivers superior toughness and reduced brittleness compared to standard resins. Their Tenacious resin, in particular, has become legendary in the community for its flexibility and impact resistance, perfect for functional parts. Siraya Tech's commitment to innovation is evident in their diverse product line, which includes specialized resins for different applications from miniatures to engineering prototypes.\n\nThe company actively engages with the resin printing community, gathering feedback and continuously refining formulations. Their success is built on transparency, providing detailed technical data and responsive customer support. Siraya Tech's resins work seamlessly across various resin printer brands, demonstrating universal compatibility. Their water-washable options have also gained popularity for simplifying post-processing workflows. As resin printing continues to grow, Siraya Tech remains at the forefront, developing innovative materials that expand creative and functional possibilities.",
    location: "San Gabriel, California, USA",
    companyType: "private",
    headquarters: "San Gabriel, California, USA",
    website: "https://siraya.tech"
  },
  "NinjaTek": {
    summary: "NinjaTek is a premier American manufacturer specializing in flexible and engineering-grade filaments, based in Manheim, Pennsylvania. A brand of Fenner Drives (part of Fenner PLC, now owned by Michelin), NinjaTek has become synonymous with high-quality flexible filaments. Their flagship product, NinjaFlex, revolutionized desktop 3D printing by making reliable flexible filament printing accessible to consumer machines.\n\nThe company has achieved remarkable success by focusing on TPU and TPE materials that deliver exceptional flexibility, durability, and printability. Their proprietary formulations undergo extensive testing to ensure consistent performance across various printer platforms. NinjaTek's product line has expanded to include Cheetah, a faster-printing flexible filament, and Armadillo, an engineering TPU with outstanding abrasion resistance.\n\nTheir success is built on deep technical expertise and close collaboration with the maker community. NinjaTek provides comprehensive printing guides and technical support, helping users achieve success with flexible materials. The company's materials have enabled countless innovative projects, from custom grips to impact-resistant cases. NinjaTek continues to innovate, developing new formulations that push the boundaries of flexible filament performance, earning them the status of gold standard for flexible printing.",
    location: "Manheim, Pennsylvania, USA",
    companyType: "subsidiary",
    parentCompany: "Michelin (EPA: ML)",
    headquarters: "311 West Stiegel Street, Manheim, PA 17545, USA",
    website: "https://ninjatek.com"
  },
  "eSun": {
    summary: "eSun (Shenzhen Esun Industrial Co., Ltd.) is a major Chinese filament manufacturer and pioneer in the 3D printing materials industry, headquartered in Shenzhen. Founded in 2002, the company has over two decades of experience in polymer materials and has grown into one of the world's largest producers of 3D printing filaments. eSun is a publicly traded company on the Shenzhen Stock Exchange.\n\neSun's extensive product portfolio includes their popular PLA+, ABS+, and PETG lines, which have earned global recognition for consistent quality at competitive prices. The company operates state-of-the-art manufacturing facilities with rigorous quality control systems, ensuring dimensional accuracy and material purity. Their flagship ePLA and ePLA-ST lines showcase their expertise in PLA formulation, delivering enhanced mechanical properties and beautiful finish quality.\n\nThe company's commitment to research and development has resulted in numerous specialty materials, including their popular silk PLA series with stunning sheen effects. Their biodegradable and eco-friendly material options demonstrate environmental consciousness while maintaining performance standards. eSun's success is evidenced by their global distribution network spanning over 200 countries and regions. The company continues to invest in advanced manufacturing technology and material science, developing next-generation filaments for emerging applications.",
    location: "Shenzhen, China",
    founded: "2002",
    companyType: "public",
    stockTicker: "002775",
    stockExchange: "Shenzhen Stock Exchange (SZSE)",
    headquarters: "Shenzhen, Guangdong Province, China",
    employees: "1000+",
    website: "https://www.esun3d.com"
  },
  "ColorFabb": {
    summary: "ColorFabb is a prestigious Dutch filament manufacturer renowned for their innovative materials and exceptional quality standards. Based in the Netherlands, the company was founded by materials enthusiasts dedicated to creating unique and high-performance 3D printing filaments. ColorFabb's roots in European manufacturing excellence are evident in their meticulous attention to detail and consistent quality.\n\nTheir flagship products include the innovative woodFill, metalFill, and nGen lines, which have set new standards for specialty filaments. The company achieved breakthrough success with their composite filaments that incorporate real wood, copper, and bronze particles, creating prints with authentic appearance and feel. ColorFabb's nGen filament represents their commitment to developing next-generation copolyesters with superior toughness and chemical resistance.\n\nThe company collaborates closely with material suppliers and the 3D printing community to develop innovative formulations. ColorFabb's materials are manufactured with precise diameter tolerances and undergo extensive testing for consistency. Their commitment to innovation continues with regular releases of new materials that expand creative possibilities. As they grow, ColorFabb remains dedicated to their founding principles of quality, innovation, and exceptional customer service.",
    location: "Belfeld, Netherlands",
    founded: "2013",
    companyType: "private",
    headquarters: "Belfeld, Netherlands",
    website: "https://colorfabb.com"
  },
  "Matter3D": {
    summary: "Matter3D is an emerging filament manufacturer committed to delivering quality 3D printing materials with a focus on consistency and value. The company has established itself by understanding the needs of both hobbyist and professional users, developing materials that perform reliably across various applications. Matter3D's product line emphasizes practical materials that deliver dependable results, making them a trusted choice for everyday printing needs.\n\nTheir flagship PLA and PETG offerings have gained recognition for excellent layer adhesion and smooth surface finish. The company operates with a customer-centric philosophy, actively seeking feedback to refine their formulations and expand their product range. Matter3D has achieved growing success by balancing quality and affordability, making professional-grade materials accessible to a broader audience.\n\nTheir commitment to quality control ensures consistent diameter tolerances and material properties throughout every spool. The company's packaging includes proper moisture protection, demonstrating attention to material preservation and customer success. Matter3D provides clear printing guidelines and responsive customer support, helping users achieve optimal results. The company continues to expand their material portfolio based on community needs and emerging applications.",
    location: "USA",
    companyType: "private",
    website: "https://matter3d.com"
  },
  "Prusament": {
    summary: "Prusament is the premium filament brand from Prusa Research, the renowned Czech 3D printer manufacturer founded by Josef Průša. Manufactured in Prague, Czech Republic, Prusament represents the company's commitment to producing the finest quality filaments to complement their industry-leading printers. Josef Průša's vision for Prusament was to create filaments with unprecedented consistency and quality control, setting new industry standards.\n\nThe company invested in custom-designed extrusion lines with advanced monitoring systems that measure diameter 50 times per second, ensuring exceptional precision. Prusament's flagship PLA and PETG lines have become benchmarks for quality, with diameter tolerances of ±0.02mm, significantly tighter than industry standards. Prusa Research's deep roots in the open-source 3D printing community inform their approach to material development and transparency.\n\nThe company has achieved remarkable success by vertical integration, controlling every aspect from raw material selection to final packaging. Prusament materials undergo rigorous testing with detailed specifications published for every batch, providing users with confidence and traceability. Their commitment to sustainability is evident in their cardboard spool options and recyclable packaging. The brand has earned global recognition and numerous industry awards for quality and innovation.",
    location: "Prague, Czech Republic",
    founded: "2019",
    companyType: "subsidiary",
    parentCompany: "Prusa Research a.s.",
    headquarters: "Partyzánská 188/7a, Prague 7, 170 00, Czech Republic",
    founder: "Josef Průša",
    website: "https://prusament.com"
  },
  "Prusa Research": {
    summary: "Prusa Research is a leading Czech 3D printer manufacturer founded by Josef Průša, one of the core developers of the open-source RepRap project. The company is headquartered in Prague and has grown from a small workshop to one of the largest 3D printer manufacturers in the world, producing over 10,000 printers per month.\n\nPrusa Research is best known for their Original Prusa i3 MK series, which has become one of the most popular desktop 3D printers worldwide. The company maintains a strong commitment to open-source principles, sharing their designs and software with the community. Their PrusaSlicer software is one of the most widely used slicing programs in the industry.\n\nThe company has expanded into filament manufacturing with Prusament and continues to innovate with products like the Prusa XL multi-tool printer and the SL1 resin printer series. Prusa Research employs over 700 people and operates a massive 3D print farm for producing printer parts.",
    location: "Prague, Czech Republic",
    founded: "2012",
    companyType: "private",
    headquarters: "Partyzánská 188/7a, Prague 7, 170 00, Czech Republic",
    founder: "Josef Průša",
    ceo: "Josef Průša",
    employees: "700+",
    website: "https://www.prusa3d.com"
  },
  "SUNLU": {
    summary: "SUNLU is a prominent Chinese 3D printing materials manufacturer that has gained significant international recognition for their quality filaments and competitive pricing. Based in China with global distribution, SUNLU has built a strong presence across consumer and professional markets. The company was founded with a mission to make 3D printing accessible through reliable, affordable materials without compromising on performance.\n\nSUNLU's flagship PLA and PETG lines have earned widespread acclaim for their excellent dimensional accuracy and consistent printing characteristics. The company has achieved impressive growth by focusing on customer satisfaction and maintaining strict quality control throughout their manufacturing process. Their extensive product catalog includes a diverse range of materials from basic PLA to specialty filaments like silk, matte, and metallic variants.\n\nSUNLU operates modern manufacturing facilities equipped with advanced extrusion equipment and quality testing systems. The company's success is reflected in their strong presence on major retail platforms and growing international distribution network. SUNLU provides excellent value with vacuum-sealed packaging and included desiccant for optimal material preservation. The company actively engages with the global 3D printing community, gathering feedback to improve their products.",
    location: "China",
    companyType: "private",
    headquarters: "Zhuhai, Guangdong Province, China",
    website: "https://www.sunlu.com"
  },
  "Sunlu": {
    summary: "SUNLU is a prominent Chinese 3D printing materials manufacturer that has gained significant international recognition for their quality filaments and competitive pricing. Based in China with global distribution, SUNLU has built a strong presence across consumer and professional markets. The company was founded with a mission to make 3D printing accessible through reliable, affordable materials without compromising on performance.\n\nSUNLU's flagship PLA and PETG lines have earned widespread acclaim for their excellent dimensional accuracy and consistent printing characteristics. The company has achieved impressive growth by focusing on customer satisfaction and maintaining strict quality control throughout their manufacturing process. Their extensive product catalog includes a diverse range of materials from basic PLA to specialty filaments like silk, matte, and metallic variants.\n\nSUNLU operates modern manufacturing facilities equipped with advanced extrusion equipment and quality testing systems. The company's success is reflected in their strong presence on major retail platforms and growing international distribution network. SUNLU provides excellent value with vacuum-sealed packaging and included desiccant for optimal material preservation. The company actively engages with the global 3D printing community, gathering feedback to improve their products.",
    location: "China",
    companyType: "private",
    headquarters: "Zhuhai, Guangdong Province, China",
    website: "https://www.sunlu.com"
  },
  "HATCHBOX": {
    summary: "HATCHBOX is a widely recognized American filament brand that has become a favorite among 3D printing enthusiasts for their reliable quality and excellent value proposition. Based in Pomona, California, HATCHBOX has built a strong reputation through consistent performance and customer satisfaction. The company was founded with a clear focus on delivering dependable filaments that work well across various printer platforms without requiring extensive tuning.\n\nHATCHBOX's flagship PLA and ABS lines have earned legendary status in the maker community for their ease of use and consistent results. The company has achieved remarkable success by maintaining strict quality control while keeping prices accessible to hobbyists and professionals alike. Their signature bright orange spools have become iconic in the 3D printing community, instantly recognizable on maker workbenches worldwide.\n\nHATCHBOX's commitment to consistency is evident in their tight diameter tolerances and reliable material properties batch after batch. The company offers an extensive color palette, providing creative flexibility for diverse projects from functional prototypes to artistic creations. Their materials have been extensively tested by the community, with countless successful prints validating their reliability. HATCHBOX continues to expand their material offerings based on community needs while maintaining their core commitment to quality, reliability, and value.",
    location: "Pomona, California, USA",
    companyType: "private",
    headquarters: "1755 Sampson Ave, Corona, CA 92879, USA",
    website: "https://www.hatchbox3d.com"
  },
  "Hatchbox": {
    summary: "HATCHBOX is a widely recognized American filament brand that has become a favorite among 3D printing enthusiasts for their reliable quality and excellent value proposition. Based in Pomona, California, HATCHBOX has built a strong reputation through consistent performance and customer satisfaction. The company was founded with a clear focus on delivering dependable filaments that work well across various printer platforms without requiring extensive tuning.\n\nHATCHBOX's flagship PLA and ABS lines have earned legendary status in the maker community for their ease of use and consistent results. The company has achieved remarkable success by maintaining strict quality control while keeping prices accessible to hobbyists and professionals alike. Their signature bright orange spools have become iconic in the 3D printing community, instantly recognizable on maker workbenches worldwide.\n\nHATCHBOX's commitment to consistency is evident in their tight diameter tolerances and reliable material properties batch after batch. The company offers an extensive color palette, providing creative flexibility for diverse projects from functional prototypes to artistic creations. Their materials have been extensively tested by the community, with countless successful prints validating their reliability. HATCHBOX continues to expand their material offerings based on community needs while maintaining their core commitment to quality, reliability, and value.",
    location: "Pomona, California, USA",
    companyType: "private",
    headquarters: "1755 Sampson Ave, Corona, CA 92879, USA",
    website: "https://www.hatchbox3d.com"
  },
  "GreenGate3D": {
    summary: "GreenGate3D is an innovative American filament manufacturer based in Colorado, dedicated to producing high-quality materials with an emphasis on environmental sustainability. The company was founded by 3D printing enthusiasts who recognized the need for eco-conscious materials without compromising on performance. GreenGate3D's commitment to sustainability is woven into every aspect of their operation, from material sourcing to packaging choices.\n\nTheir flagship products focus on biodegradable and recycled materials that deliver professional-grade results while minimizing environmental impact. The company has achieved notable success by appealing to environmentally conscious makers who value both quality and sustainability. GreenGate3D's materials are manufactured with careful attention to diameter consistency and material purity, ensuring reliable printing performance.\n\nThe company's roots in the Colorado maker community inform their hands-on approach to product development and customer relationships. GreenGate3D provides detailed technical specifications and printing profiles to help users achieve optimal results. They actively participate in the maker community, attending events and engaging directly with customers. The company continues to research and develop new sustainable material formulations that expand possibilities for eco-friendly 3D printing.",
    location: "Colorado, USA",
    companyType: "private",
    headquarters: "Colorado, USA",
    website: "https://greengate3d.com"
  },
  "MatterHackers": {
    summary: "MatterHackers is a leading American 3D printing company headquartered in Lake Forest, California, serving as both a comprehensive retailer and materials manufacturer. Founded in 2013 by passionate makers, the company has grown into one of North America's most trusted sources for 3D printing supplies and expertise. MatterHackers' in-house filament brand offers carefully formulated materials developed through extensive testing and community feedback.\n\nTheir flagship PRO Series filaments deliver professional-grade performance for demanding applications, while their MH Build series provides reliable quality for everyday printing. The company has achieved remarkable success by combining their retail expertise with direct material manufacturing, ensuring they understand customer needs intimately. MatterHackers' roots in the maker community are evident in their commitment to education, offering extensive resources, tutorials, and technical guides.\n\nTheir success extends beyond materials to include exceptional customer service, with knowledgeable support staff helping users solve printing challenges. The company operates a sophisticated quality control system, ensuring their filaments meet strict standards for diameter tolerance and material consistency. MatterHackers has built a thriving community through their platform, connecting makers and sharing knowledge. The company continues to expand their product line based on real-world application needs and customer feedback.",
    location: "Lake Forest, California, USA",
    founded: "2013",
    companyType: "private",
    headquarters: "21040 Bake Parkway, Lake Forest, CA 92630, USA",
    website: "https://www.matterhackers.com"
  },
  "Printed Solid": {
    summary: "Printed Solid is a dedicated 3D printing materials supplier and manufacturer based in Newark, Delaware, focused on serving the maker community with quality filaments and exceptional service. The company was founded by 3D printing enthusiasts who understood the importance of reliable materials for successful printing outcomes. Printed Solid has built their reputation through careful material selection and rigorous quality standards.\n\nTheir product line includes both proprietary formulations and carefully curated materials from trusted manufacturers. The company's flagship Jessie line of premium filaments showcases their commitment to delivering exceptional quality and unique color offerings. Printed Solid has achieved success by combining material expertise with hands-on customer support from experienced 3D printing practitioners.\n\nThe company operates with a philosophy that every detail matters, from material formulation to packaging and presentation. Printed Solid's commitment to quality control ensures consistent performance across their entire product range. Their carefully selected color palette includes both classic and unique options that appeal to creative makers. The company continues to expand their offerings while maintaining their core values of quality, community, and customer service.",
    location: "Newark, Delaware, USA",
    companyType: "private",
    headquarters: "Newark, Delaware, USA",
    website: "https://www.printedsolid.com"
  },
  "Atomic Filament": {
    summary: "Atomic Filament is a premium American filament manufacturer based in Cincinnati, Ohio, renowned for their exceptional quality and unique color formulations. Founded by materials enthusiasts dedicated to advancing 3D printing, the company has established itself as a leader in premium filaments. Atomic Filament's roots in American manufacturing are evident in their commitment to local production and strict quality control.\n\nTheir flagship products showcase stunning color depth and consistency, with proprietary formulations that deliver outstanding results. The company has achieved remarkable success by focusing on the high-end segment, offering materials that justify their premium positioning through superior performance. Atomic Filament's unique color offerings, including their popular metallic and carbon fiber enhanced materials, have earned them a devoted following among makers who demand the best.\n\nThe company's commitment to American manufacturing ensures every spool meets exacting standards while supporting domestic production. Atomic Filament provides comprehensive technical data and responsive customer support, helping users achieve exceptional results. Their dedication to innovation drives continuous development of new colors and material formulations. The company's reputation for quality has made them a preferred choice for makers who refuse to compromise on material performance and appearance.",
    location: "Cincinnati, Ohio, USA",
    companyType: "private",
    headquarters: "Cincinnati, Ohio, USA",
    website: "https://atomicfilament.com"
  },
  "QIDI": {
    summary: "QIDI Tech (Zhejiang Qidi Technology Co., Ltd.) is a prominent Chinese manufacturer of 3D printers and materials, headquartered in Ruian City, Zhejiang Province. Founded in 2014, the company has grown into a significant player in the global 3D printing market, known for reliable equipment and quality materials. QIDI's engineering team brings extensive experience in precision manufacturing and automation technology.\n\nTheir flagship printers, including the X-series and i-series, have earned international recognition for build quality and reliability. The company has achieved impressive success by focusing on enclosed printer designs that enable printing of engineering materials like ABS and nylon with excellent results. QIDI's vertical integration extends to their filament production, ensuring optimal compatibility between their printers and materials.\n\nTheir commitment to quality control is evident throughout their manufacturing process, from raw materials to finished products. The company's success is reflected in their growing global presence, with products sold in over 50 countries. QIDI provides comprehensive customer support and continuously updates their products based on user feedback. As they continue to innovate, QIDI remains committed to delivering quality products that empower makers to bring their ideas to life with confidence.",
    location: "Ruian City, Zhejiang Province, China",
    founded: "2014",
    companyType: "private",
    headquarters: "Ruian City, Zhejiang Province, China",
    website: "https://www.qidi3d.com"
  },
  "Phaetus": {
    summary: "Phaetus is an innovative Chinese manufacturer specializing in high-performance 3D printing hotends, extruders, and materials, based in Shenzhen. Founded by engineers passionate about pushing the boundaries of FDM technology, the company has become renowned for developing cutting-edge components that enhance printing capabilities. Phaetus's flagship products include the Dragon hotend series and Dragonfly hotend, which have set new standards for heat dissipation efficiency and high-temperature printing.\n\nThe company has achieved remarkable success through innovation, developing proprietary technologies that enable faster printing speeds and improved temperature control. Their Rapido high-flow hotend has become particularly celebrated for enabling unprecedented print speeds without sacrificing quality. Phaetus's commitment to research and development is evident in their continuous release of advanced products that address real-world printing challenges.\n\nThe company's success extends beyond hardware to include their line of premium filaments engineered specifically for high-performance printing. Their materials are formulated to complement their hotend technology, enabling users to fully utilize their equipment's capabilities. Phaetus actively engages with the 3D printing community, incorporating feedback into product development. As they continue to innovate, Phaetus remains dedicated to advancing additive manufacturing technology through engineering excellence.",
    location: "Shenzhen, China",
    companyType: "private",
    headquarters: "Shenzhen, Guangdong Province, China",
    website: "https://www.phaetus.com"
  },
  "Gizmo Dorks": {
    summary: "Gizmo Dorks is an American 3D printing filament brand that has built a loyal following through their commitment to quality and customer service. Based in the United States, the company focuses on delivering reliable filaments at competitive prices. Their product range includes popular materials like PLA, ABS, and PETG in a variety of colors.\n\nThe company has achieved steady growth by maintaining consistent quality standards and building strong relationships with their customer base. Gizmo Dorks' filaments are known for their reliable printing performance and good dimensional accuracy. They cater primarily to hobbyists and makers who appreciate straightforward, dependable materials for their projects.\n\nGizmo Dorks maintains an active presence on Amazon and other retail platforms, making their products easily accessible to makers across North America. The company provides responsive customer support and stands behind their products with quality guarantees. Their focus on core materials rather than specialty filaments allows them to maintain competitive pricing while ensuring consistent quality across their product line.",
    location: "USA",
    companyType: "private",
    website: "https://gizmodorks.com"
  },
  "Polymaker": {
    summary: "Polymaker is a leading Chinese manufacturer of advanced 3D printing materials, headquartered in Shanghai. Founded in 2012 by Dr. Luo Xiaofan and a team of materials scientists from the East China University of Science and Technology, Polymaker has become a global leader in developing innovative filament technologies. The company has earned international recognition for their scientific approach to material development and exceptional quality standards.\n\nPolymaker's flagship products include their PolyLite, PolyMax, and PolyMide series, which have set industry benchmarks for performance and reliability. Their proprietary technologies, such as Nano-reinforcement and Anti-Drip, deliver superior mechanical properties and printing characteristics. The company has achieved remarkable success by combining academic research with practical manufacturing expertise, creating materials that push the boundaries of what's possible with FDM printing.\n\nThe company operates state-of-the-art production facilities with rigorous quality control systems, ensuring consistent performance across their product range. Polymaker's commitment to innovation is evident in their continuous research efforts and regular release of advanced materials. They maintain strong partnerships with leading printer manufacturers and actively contribute to the advancement of the 3D printing industry. With a global distribution network and strong customer focus, Polymaker continues to shape the future of 3D printing materials.",
    location: "Shanghai, China",
    founded: "2012",
    companyType: "private",
    founder: "Dr. Luo Xiaofan",
    headquarters: "Shanghai, China",
    employees: "200+",
    website: "https://polymaker.com"
  },
  "Creality": {
    summary: "Creality (Shenzhen Creality 3D Technology Co., Ltd.) is one of the world's largest manufacturers of consumer 3D printers, headquartered in Shenzhen, China. Founded in 2014, the company has revolutionized the desktop 3D printing market by making high-quality printers accessible at affordable prices. Their Ender and CR series have become some of the best-selling 3D printers globally.\n\nCreality's success is built on their ability to deliver feature-rich printers at competitive price points, democratizing 3D printing for millions of users worldwide. The company operates multiple manufacturing facilities and employs thousands of workers. Their product lineup spans from entry-level printers like the Ender-3 to professional-grade machines like the K1 Max.\n\nThe company has expanded beyond printers to offer filaments, accessories, and ecosystem products. Creality is a publicly traded company on the Shenzhen Stock Exchange and continues to invest heavily in research and development. They maintain a strong community presence with active support forums and educational initiatives to help users get the most from their printers.",
    location: "Shenzhen, China",
    founded: "2014",
    companyType: "public",
    stockTicker: "002979",
    stockExchange: "Shenzhen Stock Exchange (SZSE)",
    headquarters: "18F, JinXiu HongDu Building, Meilong Road, Longhua, Shenzhen, China",
    employees: "3000+",
    website: "https://www.creality.com"
  },
  "Anycubic": {
    summary: "Anycubic is a leading Chinese 3D printer manufacturer headquartered in Shenzhen, founded in 2015. The company has grown rapidly to become one of the top consumer 3D printer brands globally, known for their innovative designs and value-for-money products. Their Kobra series (FDM) and Photon series (resin) printers have achieved massive commercial success.\n\nAnycubic specializes in both FDM and resin 3D printing technologies, making them one of the few companies with strong presence in both markets. Their Photon series helped popularize affordable resin printing for hobbyists and has become a bestseller in the consumer market. The company emphasizes user-friendly designs and comprehensive customer support.\n\nThe company operates a large manufacturing campus in Shenzhen and has established distribution centers worldwide to serve their global customer base. Anycubic invests heavily in R&D, continuously improving their products and expanding their ecosystem with filaments, resins, and accessories. They maintain active community engagement through social media and maker events.",
    location: "Shenzhen, China",
    founded: "2015",
    companyType: "private",
    headquarters: "Shenzhen, Guangdong Province, China",
    employees: "1000+",
    website: "https://www.anycubic.com"
  },
  "Elegoo": {
    summary: "Elegoo is a Chinese electronics and 3D printing company based in Shenzhen, founded in 2015. Originally known for Arduino-compatible electronics kits, Elegoo has become a major player in the 3D printing industry, particularly in the resin printer segment with their popular Mars and Saturn series.\n\nThe company has achieved remarkable success by offering high-quality resin printers at competitive prices, making professional-grade resin printing accessible to hobbyists and small businesses. Their Saturn series, with its larger build volume, has been particularly well-received by the miniature painting and jewelry industries. Elegoo has since expanded into FDM printing with their Neptune series.\n\nElegoo maintains a strong focus on customer service and community engagement, with active presence on social media and maker forums. The company continues to innovate with new printer designs and has expanded their ecosystem to include resins, wash and cure stations, and other accessories. Their commitment to quality and value has earned them a loyal customer base worldwide.",
    location: "Shenzhen, China",
    founded: "2015",
    companyType: "private",
    headquarters: "Shenzhen, Guangdong Province, China",
    website: "https://www.elegoo.com"
  },
  "Stratasys": {
    summary: "Stratasys is one of the world's largest and oldest 3D printing companies, publicly traded on NASDAQ. Founded in 1988 by S. Scott Crump, who invented Fused Deposition Modeling (FDM), the company is headquartered in Eden Prairie, Minnesota, with significant operations in Rehovot, Israel. Stratasys has been a pioneer in industrial additive manufacturing for over three decades.\n\nThe company offers a comprehensive range of industrial 3D printing systems, including FDM, PolyJet, and stereolithography technologies. Stratasys printers are used across aerospace, automotive, healthcare, and consumer goods industries for prototyping and production applications. The company merged with Objet in 2012, combining FDM and PolyJet technologies under one roof.\n\nStratasys has made strategic acquisitions including MakerBot (later merged with Ultimaker), Origin, and Xaar 3D. The company continues to expand its materials portfolio and printing capabilities, with a focus on production-grade applications. Stratasys employs thousands of people globally and maintains a strong patent portfolio protecting their core technologies.",
    location: "Eden Prairie, Minnesota, USA / Rehovot, Israel",
    founded: "1988",
    companyType: "public",
    stockTicker: "SSYS",
    stockExchange: "NASDAQ",
    founder: "S. Scott Crump",
    ceo: "Yoav Zeif",
    headquarters: "7665 Commerce Way, Eden Prairie, MN 55344, USA",
    employees: "2000+",
    subsidiaries: ["MakerBot", "Ultimaker", "Origin", "Xaar 3D"],
    website: "https://www.stratasys.com"
  },
  "Voron Design": {
    summary: "Voron Design is an open-source community project that develops high-performance DIY 3D printer designs. Unlike commercial manufacturers, Voron is a collaborative effort by volunteers who create and maintain printer designs that anyone can build from sourced parts. The project originated in 2015 and has grown into one of the most respected DIY printer communities.\n\nVoron printers are known for their exceptional build quality, enclosed designs, and ability to print engineering materials at high speeds. Popular models include the Voron 2.4 (CoreXY), Voron Trident, Voron 0 (compact), and Voron Switchwire (bed slinger converted to CoreXY). These printers are built from detailed documentation provided by the community.\n\nThe Voron community maintains active Discord servers and GitHub repositories where builders can get support and contribute improvements. While Voron doesn't sell printers directly, the project has spawned an ecosystem of kit sellers and parts suppliers. The community emphasizes quality and precision, with detailed sourcing guides and build documentation that help builders achieve professional results.",
    location: "Global (Online Community)",
    founded: "2015",
    companyType: "open-source",
    website: "https://vorondesign.com"
  },
  "E3D": {
    summary: "E3D-Online Ltd. is a British company specializing in 3D printer components, particularly hotends and extruders. Founded in 2012 in Oxford, UK, E3D has become the gold standard for aftermarket printer upgrades. Their V6 hotend revolutionized the industry and remains one of the most cloned and respected designs in 3D printing.\n\nThe company is known for engineering excellence and rigorous testing of their products. Beyond hotends, E3D offers complete tool changer systems, motion systems, and the Revo ecosystem of quick-change nozzles. They also develop the Hemera extruder and various specialized nozzles for different applications.\n\nE3D has acquired Duet3D, makers of the popular Duet controller boards, expanding their presence in the 3D printing ecosystem. The company maintains a strong engineering-focused culture and actively collaborates with the RepRap and maker communities. Their products are used by hobbyists, professionals, and OEM manufacturers worldwide.",
    location: "Chalgrove, Oxfordshire, UK",
    founded: "2012",
    companyType: "private",
    headquarters: "Chalgrove, Oxfordshire, UK",
    subsidiaries: ["Duet3D"],
    website: "https://e3d-online.com"
  },
  "FlashForge": {
    summary: "FlashForge (Zhejiang Flashforge 3D Technology Co., Ltd.) is a Chinese 3D printer manufacturer based in Jinhua, Zhejiang Province. Founded in 2011, FlashForge was one of the first Chinese companies to enter the desktop 3D printing market and has grown to become a major global player in both consumer and professional segments.\n\nThe company offers a wide range of FDM and resin printers, from entry-level models to industrial systems. Their Adventurer and Creator series are popular among hobbyists and educators, while their professional lineup serves businesses and manufacturers. FlashForge has invested in proprietary technologies and maintains competitive R&D capabilities.\n\nFlashForge operates multiple manufacturing facilities and has established distribution networks across North America, Europe, and Asia. The company emphasizes reliability and user-friendliness in their designs, making them popular choices for educational institutions. They continue to expand their product ecosystem with filaments, accessories, and software tools.",
    location: "Jinhua, Zhejiang, China",
    founded: "2011",
    companyType: "private",
    headquarters: "Jinhua, Zhejiang Province, China",
    website: "https://www.flashforge.com"
  },
  "Raise3D": {
    summary: "Raise3D is a Chinese-American 3D printer manufacturer with headquarters in both Irvine, California and Shanghai, China. Founded in 2015, the company focuses on professional and industrial-grade FDM printers known for their reliability, large build volumes, and enclosed designs.\n\nRaise3D printers are widely used in professional environments including manufacturing, engineering, and education. Their Pro series offers industrial features like HEPA filtration, camera monitoring, and extensive material compatibility. The company developed ideaMaker, their proprietary slicing software known for its advanced features and user-friendly interface.\n\nThe company has built a strong reputation for build quality and customer support. Raise3D maintains R&D centers in both the US and China, combining Western engineering standards with Chinese manufacturing capabilities. They serve customers in over 80 countries and continue to expand their professional printer lineup.",
    location: "Irvine, California, USA / Shanghai, China",
    founded: "2015",
    companyType: "private",
    headquarters: "25 Morgan, Suite 110, Irvine, CA 92618, USA",
    website: "https://www.raise3d.com"
  },
  "Markforged": {
    summary: "Markforged is an American industrial 3D printing company headquartered in Waltham, Massachusetts. Founded in 2013 by Greg Mark, the company pioneered continuous fiber reinforcement technology that enables the printing of parts as strong as aluminum. Markforged went public via SPAC in 2021 and trades on the NYSE.\n\nThe company's technology allows embedding continuous carbon fiber, fiberglass, or Kevlar strands within composite parts, creating exceptionally strong and lightweight components. Their industrial metal printers use their proprietary Atomic Diffusion Additive Manufacturing (ADAM) process. Markforged printers are used in aerospace, automotive, defense, and manufacturing industries.\n\nMarkforged has made strategic acquisitions including Digital Metal (binder jetting) and Teton Simulation (digital inspection). The company employs hundreds of people and maintains a global network of resellers and service partners. Their focus on industrial applications and composite materials sets them apart from consumer-focused 3D printing companies.",
    location: "Waltham, Massachusetts, USA",
    founded: "2013",
    companyType: "public",
    stockTicker: "MKFG",
    stockExchange: "NYSE",
    founder: "Greg Mark",
    ceo: "Shai Terem",
    headquarters: "60 Tower Road, Waltham, MA 02451, USA",
    employees: "500+",
    website: "https://markforged.com"
  },
  "Snapmaker": {
    summary: "Snapmaker is a Chinese manufacturer of modular 3D printers and fabrication tools, headquartered in Shenzhen. Founded in 2016, the company gained recognition through successful Kickstarter campaigns and has become known for their 3-in-1 machines that combine 3D printing, laser engraving, and CNC carving in a single platform.\n\nThe Snapmaker 2.0 and Artisan series exemplify their modular approach, allowing users to switch between manufacturing methods quickly. This versatility has made Snapmaker popular among makers and small businesses that need multiple fabrication capabilities without purchasing separate machines. The company also offers dedicated 3D printers like the J1 with IDEX dual extrusion.\n\nSnapmaker maintains active community engagement through their forum and social media. The company has expanded their ecosystem with accessories, materials, and educational resources. Their focus on the maker market and all-in-one solutions has carved out a unique niche in the 3D printing industry.",
    location: "Shenzhen, China",
    founded: "2016",
    companyType: "private",
    headquarters: "Shenzhen, Guangdong Province, China",
    website: "https://www.snapmaker.com"
  },
  "LDO Motors": {
    summary: "LDO Motors (Longdingda Motors) is a Chinese manufacturer of precision stepper motors and 3D printer components, based in Changzhou, Jiangsu Province. While primarily known as a component supplier, LDO has become a trusted name in the 3D printing community for their high-quality motors and complete printer kits.\n\nThe company gained recognition by supplying premium motors for Voron and other community printer projects. Their motors are known for tight tolerances and consistent performance, making them preferred choices for high-speed printing applications. LDO also offers complete printer kits for Voron designs, providing sourced and quality-checked components.\n\nLDO's focus on quality control and community engagement has earned them a strong reputation among serious builders. They work closely with the Voron and Klipper communities to ensure their products meet the demanding requirements of modern 3D printers. The company continues to expand their product lineup with specialized components for the DIY 3D printing market.",
    location: "Changzhou, Jiangsu, China",
    companyType: "private",
    headquarters: "Changzhou, Jiangsu Province, China",
    website: "https://ldomotors.com"
  },
  "Sovol": {
    summary: "Sovol is a Chinese 3D printer brand under the umbrella of a larger manufacturing company, based in Shenzhen. Founded in 2018, Sovol has quickly gained popularity in the budget and mid-range 3D printer market, particularly with their SV series of printers.\n\nThe company focuses on delivering value-oriented printers with features typically found in more expensive models. Their SV06 and SV07 series have been well-received for their all-metal extruders, auto bed leveling, and overall build quality at competitive prices. Sovol has also entered the resin printer market with their SL series.\n\nSovol maintains an active presence on social media and maker forums, gathering feedback to improve their products. The company provides good documentation and customer support considering their price point. They continue to iterate on their designs based on community feedback, making them a popular choice for budget-conscious makers.",
    location: "Shenzhen, China",
    founded: "2018",
    companyType: "private",
    headquarters: "Shenzhen, Guangdong Province, China",
    website: "https://sovol3d.com"
  },
  "FLSUN": {
    summary: "FLSUN is a Chinese 3D printer manufacturer specializing in delta-style printers, headquartered in Zhengzhou, Henan Province. Founded in 2015, FLSUN has become one of the leading manufacturers of consumer delta printers, known for their fast print speeds and distinctive design.\n\nThe company's delta printers, including the V400 and QQ-S Pro, feature their characteristic three-tower design that enables rapid movement and high-speed printing. Delta printers excel at printing tall objects and can achieve very fast print speeds due to their lightweight print head design. FLSUN has made delta printing accessible to hobbyists with their affordable and easy-to-assemble kits.\n\nFLSUN continues to innovate in the delta printer space, pushing speeds higher while maintaining print quality. They offer good customer support and maintain active communities on various platforms. The company has carved out a unique niche by focusing specifically on delta technology rather than the more common Cartesian or CoreXY designs.",
    location: "Zhengzhou, Henan, China",
    founded: "2015",
    companyType: "private",
    headquarters: "Zhengzhou, Henan Province, China",
    website: "https://www.flsun3d.com"
  },
  "AnkerMake": {
    summary: "AnkerMake is the 3D printing brand of Anker Innovations, the Chinese consumer electronics company known for portable chargers and audio products. Anker entered the 3D printing market in 2022 with the M5 printer, applying their expertise in consumer electronics to desktop fabrication.\n\nAnker is publicly traded on the Shenzhen Stock Exchange under their parent company Anker Innovations. The company brings significant resources and consumer product experience to the 3D printing industry. Their M5 printer emphasizes speed, ease of use, and app connectivity—hallmarks of Anker's approach to consumer technology.\n\nAnkerMake printers integrate with Anker's ecosystem of apps and services, offering features like AI monitoring and cloud connectivity. The company leverages Anker's global distribution network and established customer service infrastructure. While newer to 3D printing, Anker's resources and consumer focus position AnkerMake as a significant competitor in the market.",
    location: "Shenzhen, China",
    companyType: "subsidiary",
    parentCompany: "Anker Innovations (SZSE: 300866)",
    headquarters: "Shenzhen, Guangdong Province, China",
    website: "https://www.ankermake.com"
  },
  "Proto-Pasta": {
    summary: "Proto-Pasta is a premium American specialty filament manufacturer based in Vancouver, Washington, founded by Alex Horne in 2013. The company emerged from the early RepRap community with a mission to create unique, high-quality materials that push the boundaries of desktop 3D printing. Proto-Pasta quickly established itself as a leader in composite and specialty filaments, pioneering materials that combine functional properties with stunning aesthetics.\n\nTheir flagship products include groundbreaking metal-composite filaments like Stainless Steel, Copper, Bronze, and Iron PLA that produce prints with authentic metallic weight and appearance that can be polished to a shine. The company's Carbon Fiber PLA revolutionized functional printing with its exceptional stiffness-to-weight ratio. Proto-Pasta's Conductive PLA opened new possibilities for makers creating electronic projects, while their HTPLA line offers heat-treatable polymers that achieve remarkable temperature resistance.\n\nProto-Pasta maintains a strong connection to the maker community, frequently collaborating with artists and engineers to develop new formulations. Their commitment to American manufacturing ensures rigorous quality control, with every batch tested for consistency. The company provides extensive technical documentation and printing guides, reflecting their deep expertise in materials science. Proto-Pasta continues to innovate with unique colors and special edition releases that delight the creative 3D printing community.",
    location: "Vancouver, Washington, USA",
    founded: "2013",
    companyType: "private",
    founder: "Alex Horne",
    headquarters: "Vancouver, Washington, USA",
    website: "https://www.proto-pasta.com"
  },
  "MH Build Series": {
    summary: "MH Build Series is the in-house economy filament line developed by MatterHackers, the leading American 3D printing retailer and manufacturer based in Lake Forest, California. Launched to provide reliable, budget-friendly materials without sacrificing quality, MH Build Series has become a favorite among hobbyists, educators, and prototypers who need consistent performance at accessible prices.\n\nThe MH Build Series encompasses essential materials including PLA, PETG, ABS, TPU, ASA, Nylon, and PVA support material, covering virtually every common 3D printing application. Each material is formulated in-house by MatterHackers' engineering team, drawing on years of experience testing and selling filaments from manufacturers worldwide. The result is a carefully tuned product line that prints reliably across popular printer platforms including Prusa, Creality, Bambu Lab, and more.\n\nMatterHackers backs the MH Build Series with the same exceptional customer service and technical support that has made them a trusted name in the industry. Detailed printing guidelines and material specifications help users achieve optimal results. The MH Build Series represents MatterHackers' commitment to making quality 3D printing accessible to everyone, from first-time makers to experienced professionals working on tight budgets.",
    location: "Lake Forest, California, USA",
    companyType: "subsidiary",
    parentCompany: "MatterHackers",
    headquarters: "21040 Bake Parkway, Lake Forest, CA 92630, USA",
    website: "https://www.matterhackers.com/store/c/mh-build-series"
  },
  "Fillamentum": {
    summary: "Fillamentum Manufacturing Czech s.r.o. is a prestigious European filament manufacturer based in Hulín, Czech Republic, renowned for their exceptional quality, vibrant color offerings, and commitment to European craftsmanship. Founded in 2013, the company has established itself as a leader in the premium filament market, beloved by artists, designers, and engineers who demand the finest materials for their work.\n\nTheir flagship Extrafill line showcases an extraordinary palette of precisely formulated colors, with shades ranging from subtle earth tones to brilliant metallics that are unmatched in the industry. Fillamentum's Crystal Clear PETG and PLA have become benchmarks for transparency, while their CPE (Copolyester) materials offer exceptional chemical resistance and toughness. The company's Flexfill TPE and TPU lines deliver reliable flexible printing with consistent shore hardness ratings.\n\nFillamentum's manufacturing facility combines traditional European quality standards with modern production technology. Every spool undergoes rigorous quality control, and the company maintains tight diameter tolerances of ±0.02mm. Their commitment to sustainability is evident in their eco-friendly packaging and recyclable cardboard spools. Fillamentum has earned numerous awards for innovation and quality, establishing their reputation as the premier choice for makers who refuse to compromise on color accuracy, surface finish, and material performance.",
    location: "Hulín, Czech Republic",
    founded: "2013",
    companyType: "private",
    headquarters: "Záhumenní 1454, 768 24 Hulín, Czech Republic",
    website: "https://fillamentum.com"
  }
};

export const getBrandInfo = (brandName: string): BrandInfoData | null => {
  return brandInfo[brandName] || null;
};
