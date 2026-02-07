import { LegalPageLayout, LegalSection, LegalList } from "@/components/legal/LegalPageLayout";

export default function PrivacyPolicy() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      lastUpdated="February 7, 2026"
      metaDescription="FilaScope Privacy Policy - Learn how we collect, use, and protect your personal information when using our 3D printing filament comparison service."
    >
      <LegalSection title="Introduction">
        <p>
          At FilaScope, we take your privacy seriously. This Privacy Policy explains how we collect, 
          use, disclose, and safeguard your information when you visit our website. Please read this 
          policy carefully to understand our views and practices regarding your personal data.
        </p>
      </LegalSection>

      <LegalSection title="Information We Collect">
        <p>We collect information in the following ways:</p>
        <LegalList items={[
          "Email address: If you subscribe to our newsletter, we collect your email address to send you updates about deals, new features, and filament recommendations.",
          "Region and currency preferences: We store your preferred region and currency settings in your browser's localStorage to provide a personalized experience.",
          "Analytics data: We collect anonymous usage data to understand how visitors interact with our site, including pages viewed, time spent, and general navigation patterns.",
          "Device information: We may collect information about your device type, browser, and operating system to optimize your experience."
        ]} />
      </LegalSection>

      <LegalSection title="Cookies and Local Storage">
        <p>
          We use cookies and similar technologies to enhance your browsing experience:
        </p>
        <LegalList items={[
          "Preference cookies: Store your region, currency, and display preferences.",
          "Analytics cookies: Help us understand how visitors use our site to improve our service.",
          "Session cookies: Maintain your browsing session and remember your interactions."
        ]} />
        <p>
          You can control cookie settings through your browser preferences. Disabling cookies may 
          affect the functionality of certain features.
        </p>
      </LegalSection>

      <LegalSection title="Third-Party Services">
        <p>
          FilaScope contains affiliate links to third-party retailers including Amazon and various 
          filament brand stores. When you click these links:
        </p>
        <LegalList items={[
          "You will be redirected to the third-party retailer's website.",
          "The retailer's privacy policy will govern any data they collect.",
          "We may earn a commission from purchases made through these links.",
          "We do not share your personal information with these retailers."
        ]} />
      </LegalSection>

      <LegalSection title="How We Use Your Information">
        <p>We use the information we collect to:</p>
        <LegalList items={[
          "Provide and maintain our filament comparison service.",
          "Send newsletter updates (only if you've subscribed).",
          "Analyze and improve our website's functionality and content.",
          "Remember your preferences and settings.",
          "Respond to your inquiries and support requests."
        ]} />
      </LegalSection>

      <LegalSection title="Your Rights">
        <p>
          Depending on your location, you may have certain rights regarding your personal data:
        </p>
        <LegalList items={[
          "Access: Request a copy of the personal data we hold about you.",
          "Correction: Request correction of inaccurate or incomplete data.",
          "Deletion: Request deletion of your personal data.",
          "Opt-out: Unsubscribe from our newsletter at any time using the link in any email.",
          "Data portability: Request your data in a portable format."
        ]} />
        <p>
          To exercise any of these rights, please contact us using the information below.
        </p>
      </LegalSection>

      <LegalSection title="Data Security">
        <p>
          We implement appropriate technical and organizational measures to protect your personal 
          information against unauthorized access, alteration, disclosure, or destruction. However, 
          no method of transmission over the Internet is 100% secure.
        </p>
      </LegalSection>

      <LegalSection title="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any changes 
          by posting the new policy on this page and updating the "Last updated" date. We encourage 
          you to review this policy periodically.
        </p>
      </LegalSection>

      <LegalSection title="Contact Us">
        <p>
          If you have any questions about this Privacy Policy or our data practices, please contact us at:
        </p>
        <p className="mt-2">
          <a 
            href="mailto:hello@filascope.com" 
            className="text-primary hover:underline"
          >
            hello@filascope.com
          </a>
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
