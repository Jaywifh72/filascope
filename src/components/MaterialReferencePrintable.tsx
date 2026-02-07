import { type MaterialReferenceInfo } from "@/lib/materialReferenceData";
import { getMaterialInfo } from "@/lib/materialHierarchy";

interface MaterialReferencePrintableProps {
  reference: MaterialReferenceInfo;
}

const PrintSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-4 break-inside-avoid">
    <h3 className="text-sm font-bold uppercase tracking-wide border-b border-black pb-1 mb-2">{title}</h3>
    <div className="text-xs leading-relaxed">{children}</div>
  </div>
);

const PrintList = ({ items }: { items?: string[] }) => {
  if (!items || items.length === 0) return <span className="italic text-gray-500">N/A</span>;
  return (
    <ul className="list-disc list-inside space-y-0.5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
};

const PrintBadges = ({ items }: { items?: string[] }) => {
  if (!items || items.length === 0) return <span className="italic text-gray-500">N/A</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <span key={i} className="px-1.5 py-0.5 bg-gray-200 text-[10px] rounded">{item}</span>
      ))}
    </div>
  );
};

export const MaterialReferencePrintable = ({ reference }: MaterialReferencePrintableProps) => {
  const basicInfo = getMaterialInfo(reference.name);

  return (
    <div className="print-content bg-white text-black p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b-2 border-black pb-3 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{reference.fullName}</h1>
            <p className="text-sm text-gray-600">({reference.name})</p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>FilaScope Material Reference</p>
            <p>Quick Reference Guide</p>
          </div>
        </div>
        {basicInfo?.description && (
          <p className="text-sm mt-2 text-gray-700">{basicInfo.description}</p>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div>
          {/* Print Settings - Most Important for Workshop */}
          {reference.printSettings && (
            <PrintSection title="🌡️ Print Settings">
              <div className="space-y-1.5">
                {reference.printSettings.nozzleTemp && (
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="font-medium">Nozzle Temp:</span>
                    <span className="font-mono">{reference.printSettings.nozzleTemp.min}–{reference.printSettings.nozzleTemp.max}°C
                      {reference.printSettings.nozzleTemp.optimal && ` (opt: ${reference.printSettings.nozzleTemp.optimal}°C)`}
                    </span>
                  </div>
                )}
                {reference.printSettings.bedTemp && (
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="font-medium">Bed Temp:</span>
                    <span className="font-mono">{reference.printSettings.bedTemp.min}–{reference.printSettings.bedTemp.max}°C
                      {reference.printSettings.bedTemp.optimal && ` (opt: ${reference.printSettings.bedTemp.optimal}°C)`}
                    </span>
                  </div>
                )}
                {reference.printSettings.coolingFan && (
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="font-medium">Cooling Fan:</span>
                    <span className="font-mono">{reference.printSettings.coolingFan.min}–{reference.printSettings.coolingFan.max}%</span>
                  </div>
                )}
                {reference.printSettings.printSpeed && (
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="font-medium">Print Speed:</span>
                    <span className="font-mono">{reference.printSettings.printSpeed.recommended}</span>
                  </div>
                )}
                {reference.printSettings.enclosure && (
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="font-medium">Enclosure:</span>
                    <span className={reference.printSettings.enclosure.required ? "font-bold" : ""}>
                      {reference.printSettings.enclosure.required ? "REQUIRED" : "Not Required"}
                    </span>
                  </div>
                )}
                {reference.printSettings.drying && (
                  <div className="flex justify-between">
                    <span className="font-medium">Drying:</span>
                    <span className="font-mono">{reference.printSettings.drying.temp}°C, {reference.printSettings.drying.duration}</span>
                  </div>
                )}
              </div>
              {reference.printSettings.additionalNotes && reference.printSettings.additionalNotes.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="font-medium text-[10px] uppercase text-gray-600 mb-1">Notes:</p>
                  <ul className="list-disc list-inside text-[10px] space-y-0.5">
                    {reference.printSettings.additionalNotes.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </PrintSection>
          )}

          {/* Bed Adhesion */}
          {reference.adhesion && (
            <PrintSection title="🛏️ Bed Adhesion">
              {reference.adhesion.bedSurfaces?.excellent && (
                <div className="mb-1.5">
                  <span className="font-medium text-green-700">✓ Excellent:</span>{" "}
                  {reference.adhesion.bedSurfaces.excellent.join(", ")}
                </div>
              )}
              {reference.adhesion.bedSurfaces?.good && (
                <div className="mb-1.5">
                  <span className="font-medium text-yellow-700">○ Good:</span>{" "}
                  {reference.adhesion.bedSurfaces.good.join(", ")}
                </div>
              )}
              {reference.adhesion.bedSurfaces?.poor && (
                <div className="mb-1.5">
                  <span className="font-medium text-red-700">✗ Poor:</span>{" "}
                  {reference.adhesion.bedSurfaces.poor.join(", ")}
                </div>
              )}
              {reference.adhesion.releaseAgents && (
                <p className="text-[10px] mt-1 text-gray-600">
                  <span className="font-medium">Release:</span> {reference.adhesion.releaseAgents}
                </p>
              )}
            </PrintSection>
          )}

          {/* TDS Properties */}
          {reference.tdsProfile && (
            <PrintSection title="📊 Technical Properties">
              <table className="w-full text-[10px]">
                <tbody>
                  {reference.tdsProfile.properties.map((prop, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-0.5 font-medium">{prop.name}</td>
                      <td className="py-0.5 font-mono text-right">
                        {prop.value} {prop.unit && <span className="text-gray-500">{prop.unit}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PrintSection>
          )}

          {/* Safety */}
          {reference.safety && (
            <PrintSection title="⚠️ Safety">
              <div className="space-y-1">
                {reference.safety.fumes && (
                  <p><span className="font-medium">Fumes:</span> {reference.safety.fumes.level} - {reference.safety.fumes.notes}</p>
                )}
                {reference.safety.foodSafety && (
                  <p><span className="font-medium">Food Safety:</span> {reference.safety.foodSafety.rating}</p>
                )}
                {reference.safety.additionalNotes && (
                  <ul className="list-disc list-inside text-[10px] mt-1">
                    {reference.safety.additionalNotes.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                )}
              </div>
            </PrintSection>
          )}
        </div>

        {/* Right Column */}
        <div>
          {/* Multi-Material Compatibility */}
          {reference.adhesion?.multiMaterial && reference.adhesion.multiMaterial.length > 0 && (
            <PrintSection title="🔗 Multi-Material Compatibility">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-0.5">Material</th>
                    <th className="text-left py-0.5">Bond</th>
                  </tr>
                </thead>
                <tbody>
                  {reference.adhesion.multiMaterial.map((mm, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-0.5 font-medium">{mm.material}</td>
                      <td className="py-0.5">
                        <span className={
                          mm.bondQuality === 'Strong Chemical Bond' ? 'text-green-700' :
                          mm.bondQuality === 'Mechanical Bond' ? 'text-yellow-700' :
                          mm.bondQuality === 'Weak Bond' ? 'text-orange-600' :
                          'text-red-700'
                        }>
                          {mm.bondQuality}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PrintSection>
          )}

          {/* Post-Processing */}
          {reference.postProcessing && (
            <PrintSection title="🔧 Post-Processing">
              {reference.postProcessing.chemicalSmoothing && (
                <div className="mb-2">
                  <p className="font-medium text-[10px] uppercase text-gray-600">Chemical Smoothing:</p>
                  {reference.postProcessing.chemicalSmoothing.map((method, i) => (
                    <p key={i} className="ml-2">
                      <span className={
                        method.effectiveness === 'Excellent' ? 'text-green-700 font-medium' :
                        method.effectiveness === 'Good' ? 'text-yellow-700' :
                        method.effectiveness === 'Difficult' ? 'text-orange-600' :
                        'text-red-700'
                      }>
                        {method.method}
                      </span>: {method.effectiveness}
                    </p>
                  ))}
                </div>
              )}
              {reference.postProcessing.mechanical && (
                <div className="mb-2">
                  <p className="font-medium text-[10px] uppercase text-gray-600">Mechanical:</p>
                  <p className="ml-2">{reference.postProcessing.mechanical.join(", ")}</p>
                </div>
              )}
              {reference.postProcessing.glues && (
                <div className="mb-2">
                  <p className="font-medium text-[10px] uppercase text-gray-600">Glues:</p>
                  <p className="ml-2">{reference.postProcessing.glues.join(", ")}</p>
                </div>
              )}
            </PrintSection>
          )}

          {/* Strengths */}
          {reference.strengths.whyChooseThis && (
            <PrintSection title="✅ Why Choose This">
              <p className="bg-green-50 border border-green-200 p-2 rounded">{reference.strengths.whyChooseThis}</p>
            </PrintSection>
          )}

          {/* When NOT to Use */}
          {reference.weaknesses.whenNotToUse && (
            <PrintSection title="❌ When NOT to Use">
              <PrintList items={reference.weaknesses.whenNotToUse} />
            </PrintSection>
          )}

          {/* Common Applications */}
          {reference.practicalContext.commonApplications && (
            <PrintSection title="🎯 Common Applications">
              <PrintBadges items={reference.practicalContext.commonApplications} />
            </PrintSection>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-3 border-t border-gray-300 text-center text-[10px] text-gray-500">
        <p>Generated from FilaScope Material Knowledge Base • filascope.com</p>
      </div>
    </div>
  );
};

export const printMaterialReference = (reference: MaterialReferenceInfo) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print the material reference sheet.');
    return;
  }

  const basicInfo = getMaterialInfo(reference.name);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${reference.fullName} - Material Reference Sheet</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; line-height: 1.4; color: #000; background: #fff; }
    .page { max-width: 8.5in; margin: 0 auto; padding: 0.4in; }
    .header { border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
    .header h1 { font-size: 24px; font-weight: bold; margin-bottom: 2px; }
    .header .subtitle { font-size: 12px; color: #666; }
    .header .branding { float: right; text-align: right; font-size: 10px; color: #999; }
    .description { font-size: 11px; color: #444; margin-top: 8px; }
    .columns { display: flex; gap: 24px; }
    .column { flex: 1; }
    .section { margin-bottom: 14px; break-inside: avoid; }
    .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 8px; }
    .row { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 3px 0; }
    .row-label { font-weight: 500; }
    .row-value { font-family: 'SF Mono', Monaco, monospace; }
    .list { list-style: disc; padding-left: 16px; }
    .list li { margin: 2px 0; }
    .badges { display: flex; flex-wrap: wrap; gap: 4px; }
    .badge { background: #e5e5e5; padding: 2px 6px; border-radius: 3px; font-size: 9px; }
    .green { color: #15803d; }
    .yellow { color: #a16207; }
    .orange { color: #c2410c; }
    .red { color: #dc2626; }
    .bold { font-weight: bold; }
    .callout { padding: 8px; border-radius: 4px; margin-top: 4px; }
    .callout-green { background: #dcfce7; border: 1px solid #86efac; }
    .callout-red { background: #fee2e2; border: 1px solid #fca5a5; }
    .notes { margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; }
    .notes-title { font-size: 9px; font-weight: 500; text-transform: uppercase; color: #666; margin-bottom: 4px; }
    .notes-list { font-size: 9px; padding-left: 12px; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { text-align: left; padding: 2px 4px; border-bottom: 1px solid #eee; }
    .table th { font-size: 9px; text-transform: uppercase; color: #666; border-bottom: 1px solid #ccc; }
    .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc; text-align: center; font-size: 9px; color: #999; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="branding">FilaScope<br>Material Reference</div>
      <h1>${reference.fullName}</h1>
      <div class="subtitle">(${reference.name})</div>
      ${basicInfo?.description ? `<p class="description">${basicInfo.description}</p>` : ''}
    </div>

    <div class="columns">
      <div class="column">
        ${reference.printSettings ? `
        <div class="section">
          <div class="section-title">🌡️ Print Settings</div>
          ${reference.printSettings.nozzleTemp ? `<div class="row"><span class="row-label">Nozzle Temp:</span><span class="row-value">${reference.printSettings.nozzleTemp.min}–${reference.printSettings.nozzleTemp.max}°C${reference.printSettings.nozzleTemp.optimal ? ` (opt: ${reference.printSettings.nozzleTemp.optimal}°C)` : ''}</span></div>` : ''}
          ${reference.printSettings.bedTemp ? `<div class="row"><span class="row-label">Bed Temp:</span><span class="row-value">${reference.printSettings.bedTemp.min}–${reference.printSettings.bedTemp.max}°C${reference.printSettings.bedTemp.optimal ? ` (opt: ${reference.printSettings.bedTemp.optimal}°C)` : ''}</span></div>` : ''}
          ${reference.printSettings.coolingFan ? `<div class="row"><span class="row-label">Cooling Fan:</span><span class="row-value">${reference.printSettings.coolingFan.min}–${reference.printSettings.coolingFan.max}%</span></div>` : ''}
          ${reference.printSettings.printSpeed ? `<div class="row"><span class="row-label">Print Speed:</span><span class="row-value">${reference.printSettings.printSpeed.recommended}</span></div>` : ''}
          ${reference.printSettings.enclosure ? `<div class="row"><span class="row-label">Enclosure:</span><span class="row-value ${reference.printSettings.enclosure.required ? 'bold' : ''}">${reference.printSettings.enclosure.required ? 'REQUIRED' : 'Not Required'}</span></div>` : ''}
          ${reference.printSettings.drying ? `<div class="row"><span class="row-label">Drying:</span><span class="row-value">${reference.printSettings.drying.temp}°C, ${reference.printSettings.drying.duration}</span></div>` : ''}
          ${reference.printSettings.additionalNotes && reference.printSettings.additionalNotes.length > 0 ? `
            <div class="notes">
              <div class="notes-title">Notes:</div>
              <ul class="notes-list">${reference.printSettings.additionalNotes.map(n => `<li>${n}</li>`).join('')}</ul>
            </div>
          ` : ''}
        </div>
        ` : ''}

        ${reference.adhesion ? `
        <div class="section">
          <div class="section-title">🛏️ Bed Adhesion</div>
          ${reference.adhesion.bedSurfaces?.excellent ? `<div class="row"><span class="row-label green">✓ Excellent:</span><span>${reference.adhesion.bedSurfaces.excellent.join(', ')}</span></div>` : ''}
          ${reference.adhesion.bedSurfaces?.good ? `<div class="row"><span class="row-label yellow">○ Good:</span><span>${reference.adhesion.bedSurfaces.good.join(', ')}</span></div>` : ''}
          ${reference.adhesion.bedSurfaces?.poor ? `<div class="row"><span class="row-label red">✗ Poor:</span><span>${reference.adhesion.bedSurfaces.poor.join(', ')}</span></div>` : ''}
        </div>
        ` : ''}

        ${reference.tdsProfile ? `
        <div class="section">
          <div class="section-title">📊 Technical Properties</div>
          <table class="table">
            <tbody>
              ${reference.tdsProfile.properties.map(p => `
                <tr><td>${p.name}</td><td class="row-value">${p.value} ${p.unit || ''}</td></tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${reference.safety ? `
        <div class="section">
          <div class="section-title">⚠️ Safety</div>
          ${reference.safety.fumes ? `<div class="row"><span class="row-label">Fumes:</span><span>${reference.safety.fumes.level}</span></div>` : ''}
          ${reference.safety.foodSafety ? `<div class="row"><span class="row-label">Food Safety:</span><span>${reference.safety.foodSafety.rating}</span></div>` : ''}
        </div>
        ` : ''}
      </div>

      <div class="column">
        ${reference.adhesion?.multiMaterial && reference.adhesion.multiMaterial.length > 0 ? `
        <div class="section">
          <div class="section-title">🔗 Multi-Material</div>
          <table class="table">
            <thead><tr><th>Material</th><th>Bond</th></tr></thead>
            <tbody>
              ${reference.adhesion.multiMaterial.map(m => `
                <tr>
                  <td>${m.material}</td>
                  <td class="${m.bondQuality === 'Strong Chemical Bond' ? 'green' : m.bondQuality === 'Mechanical Bond' ? 'yellow' : m.bondQuality === 'Weak Bond' ? 'orange' : 'red'}">${m.bondQuality}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${reference.postProcessing ? `
        <div class="section">
          <div class="section-title">🔧 Post-Processing</div>
          ${reference.postProcessing.chemicalSmoothing ? `
            <div style="margin-bottom: 6px;">
              <span class="bold">Chemical:</span>
              ${reference.postProcessing.chemicalSmoothing.map(m => `<span class="${m.effectiveness === 'Excellent' ? 'green' : m.effectiveness === 'Good' ? 'yellow' : m.effectiveness === 'Difficult' ? 'orange' : 'red'}"> ${m.method} (${m.effectiveness})</span>`).join(',')}
            </div>
          ` : ''}
          ${reference.postProcessing.glues ? `<div><span class="bold">Glues:</span> ${reference.postProcessing.glues.join(', ')}</div>` : ''}
        </div>
        ` : ''}

        ${reference.strengths.whyChooseThis ? `
        <div class="section">
          <div class="section-title">✅ Why Choose This</div>
          <div class="callout callout-green">${reference.strengths.whyChooseThis}</div>
        </div>
        ` : ''}

        ${reference.weaknesses.whenNotToUse && reference.weaknesses.whenNotToUse.length > 0 ? `
        <div class="section">
          <div class="section-title">❌ When NOT to Use</div>
          <ul class="list">${reference.weaknesses.whenNotToUse.map(w => `<li>${w}</li>`).join('')}</ul>
        </div>
        ` : ''}

        ${reference.practicalContext.commonApplications && reference.practicalContext.commonApplications.length > 0 ? `
        <div class="section">
          <div class="section-title">🎯 Applications</div>
          <div class="badges">${reference.practicalContext.commonApplications.map(a => `<span class="badge">${a}</span>`).join('')}</div>
        </div>
        ` : ''}
      </div>
    </div>

    <div class="footer">
      Generated from FilaScope Material Knowledge Base • filascope.com • ${new Date().toLocaleDateString()}
    </div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
