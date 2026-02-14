/**
 * Development-only JSON-LD schema validator.
 * Tree-shaken out of production builds.
 */

interface ValidationError {
  schemaType: string;
  field: string;
  message: string;
}

const REQUIRED_CONTEXT = "https://schema.org";
const PROD_DOMAIN = "https://filascope.com";

function validateUrls(obj: unknown, path: string, errors: ValidationError[], schemaType: string) {
  if (typeof obj === "string") {
    if (
      (obj.startsWith("http://localhost") || obj.startsWith("https://localhost") || obj.includes("lovable.app")) &&
      !obj.includes(PROD_DOMAIN)
    ) {
      errors.push({ schemaType, field: path, message: `URL points to dev/preview domain: "${obj}"` });
    }
    // Check for UUID-based filament URLs
    if (obj.includes("/filament/") && /\/filament\/[0-9a-f]{8}-[0-9a-f]{4}-/.test(obj)) {
      errors.push({ schemaType, field: path, message: `URL uses UUID instead of slug: "${obj}"` });
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, i) => validateUrls(item, `${path}[${i}]`, errors, schemaType));
  } else if (obj && typeof obj === "object") {
    for (const [key, val] of Object.entries(obj)) {
      validateUrls(val, `${path}.${key}`, errors, schemaType);
    }
  }
}

function requireField(schema: Record<string, unknown>, field: string, schemaType: string, errors: ValidationError[]) {
  if (schema[field] === undefined || schema[field] === null || schema[field] === "") {
    errors.push({ schemaType, field, message: `Missing required field "${field}"` });
  }
}

function validateProduct(schema: Record<string, unknown>, errors: ValidationError[]) {
  requireField(schema, "name", "Product", errors);
  requireField(schema, "url", "Product", errors);
  if (!schema.brand) {
    errors.push({ schemaType: "Product", field: "brand", message: 'Missing "brand" object' });
  }
}

function validateBreadcrumbList(schema: Record<string, unknown>, errors: ValidationError[]) {
  const items = schema.itemListElement;
  if (!Array.isArray(items)) {
    errors.push({ schemaType: "BreadcrumbList", field: "itemListElement", message: "Must be an array" });
    return;
  }
  items.forEach((item: Record<string, unknown>, i: number) => {
    if (item.position === undefined) {
      errors.push({ schemaType: "BreadcrumbList", field: `itemListElement[${i}].position`, message: "Missing position" });
    }
  });
}

function validateArticle(schema: Record<string, unknown>, errors: ValidationError[]) {
  requireField(schema, "headline", "Article", errors);
}

function validateFAQPage(schema: Record<string, unknown>, errors: ValidationError[]) {
  const main = schema.mainEntity;
  if (!Array.isArray(main)) {
    errors.push({ schemaType: "FAQPage", field: "mainEntity", message: "Must be an array of Questions" });
    return;
  }
  main.forEach((q: Record<string, unknown>, i: number) => {
    if (q["@type"] !== "Question") {
      errors.push({ schemaType: "FAQPage", field: `mainEntity[${i}].@type`, message: `Expected "Question", got "${q["@type"]}"` });
    }
  });
}

function validateSchema(schema: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];
  const schemaType = (schema["@type"] as string) || "Unknown";

  if (schema["@context"] !== REQUIRED_CONTEXT) {
    errors.push({ schemaType, field: "@context", message: `Expected "${REQUIRED_CONTEXT}", got "${schema["@context"]}"` });
  }
  if (!schema["@type"]) {
    errors.push({ schemaType, field: "@type", message: "Missing @type field" });
  }

  // Type-specific validation
  switch (schemaType) {
    case "Product": validateProduct(schema, errors); break;
    case "BreadcrumbList": validateBreadcrumbList(schema, errors); break;
    case "Article": validateArticle(schema, errors); break;
    case "FAQPage": validateFAQPage(schema, errors); break;
  }

  // URL checks across all schemas
  validateUrls(schema, "root", errors, schemaType);

  return errors;
}

export function runSchemaValidation(pathname: string) {
  if (process.env.NODE_ENV !== "development") return;

  // Small delay to let Helmet inject tags
  setTimeout(() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    const types: string[] = [];
    let totalErrors = 0;

    scripts.forEach((el, i) => {
      const raw = el.textContent || "";
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        console.warn(`%c[SEO] Schema #${i + 1}: Invalid JSON`, "color: #f97316; font-weight: bold", e);
        totalErrors++;
        return;
      }

      const schemaType = (parsed["@type"] as string) || "Unknown";
      const errors = validateSchema(parsed);

      if (errors.length > 0) {
        totalErrors += errors.length;
        types.push(`${schemaType} ❌`);
        errors.forEach((err) => {
          console.warn(
            `%c[SEO] ${err.schemaType}.${err.field}: ${err.message}`,
            "color: #f97316"
          );
        });
      } else {
        types.push(`${schemaType} ✅`);
      }
    });

    const summary = types.length > 0
      ? `Found ${scripts.length} JSON-LD schema(s) on ${pathname} — ${types.join(", ")}`
      : `No JSON-LD schemas found on ${pathname}`;

    const style = totalErrors > 0
      ? "color: #f97316; font-weight: bold"
      : "color: #22c55e; font-weight: bold";

    console.log(
      `%c[FilaScope SEO] ${summary}${totalErrors > 0 ? ` (${totalErrors} error${totalErrors > 1 ? "s" : ""})` : " — no errors"}`,
      style
    );
  }, 500);
}
