import { useState } from "react";
import { BrandAliasTable } from "./brand-mapping/BrandAliasTable";
import { UnmatchedBrandsReport } from "./brand-mapping/UnmatchedBrandsReport";
import { LinkVerificationTest } from "./brand-mapping/LinkVerificationTest";
import { ProductUrlDomainsManager } from "./brand-mapping/ProductUrlDomainsManager";

export function BrandMappingTab() {
  return (
    <div className="space-y-8">
      <BrandAliasTable />
      <UnmatchedBrandsReport />
      <LinkVerificationTest />
      <ProductUrlDomainsManager />
    </div>
  );
}
