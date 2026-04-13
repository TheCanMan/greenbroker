export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="section-title">Privacy Policy</h1>
        <p className="text-gray-600 text-sm">Last updated: April 2026</p>
      </div>

      <div className="prose prose-sm max-w-none">
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Information We Collect
          </h2>
          <p className="text-gray-700 mb-4">
            We collect information you provide directly to us, such as when you
            create an account, complete an assessment, or contact us for support.
            This information includes:
          </p>
          <ul className="list-disc pl-5 text-gray-700 space-y-2 mb-4">
            <li>Name and contact information (email, phone)</li>
            <li>Address and property information</li>
            <li>Energy assessment responses and preferences</li>
            <li>Payment information (processed securely via Stripe)</li>
            <li>Account login credentials</li>
          </ul>
          <p className="text-gray-700 mb-4">
            We also collect information automatically when you use our platform,
            including usage patterns, device information, and IP addresses.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            How We Use It
          </h2>
          <p className="text-gray-700 mb-4">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-5 text-gray-700 space-y-2 mb-4">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Monitor and analyze usage patterns to improve user experience</li>
            <li>Detect and prevent fraudulent transactions and other illegal activities</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Third Parties
          </h2>
          <p className="text-gray-700 mb-4">
            We may share your information with third parties who assist us in
            operating our website, conducting our business, or serving you, as long
            as those parties agree to keep this information confidential. These
            include:
          </p>
          <ul className="list-disc pl-5 text-gray-700 space-y-2 mb-4">
            <li>
              <strong>Supabase:</strong> Our authentication and database provider
            </li>
            <li>
              <strong>Stripe:</strong> Our payment processor for handling payments
              securely
            </li>
            <li>
              <strong>Resend:</strong> Our email service provider for sending
              communications
            </li>
            <li>Service providers who help us deliver our services</li>
          </ul>
          <p className="text-gray-700 mb-4">
            We do not sell, trade, or rent your personal information to third
            parties.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Data Security
          </h2>
          <p className="text-gray-700 mb-4">
            We implement appropriate technical and organizational measures designed
            to protect your personal information against accidental or unlawful
            destruction, loss, alteration, unauthorized disclosure, or access. These
            measures include encryption, secure connections, and access controls.
          </p>
          <p className="text-gray-700 mb-4">
            However, no method of transmission over the Internet or electronic storage
            is completely secure. While we strive to use commercially acceptable means
            to protect your information, we cannot guarantee absolute security.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact</h2>
          <p className="text-gray-700">
            If you have any questions about this Privacy Policy, please contact us at
            support@greenbroker.com.
          </p>
        </section>
      </div>
    </div>
  );
}
