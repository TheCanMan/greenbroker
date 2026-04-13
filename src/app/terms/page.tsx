export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="section-title">Terms of Service</h1>
        <p className="text-gray-600 text-sm">Last updated: April 2026</p>
      </div>

      <div className="prose prose-sm max-w-none">
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Overview
          </h2>
          <p className="text-gray-700 mb-4">
            GreenBroker is a residential energy efficiency information platform that
            connects homeowners with rebate programs, contractors, and energy-saving
            solutions. These Terms of Service govern your use of our website and
            services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Use of Service
          </h2>
          <p className="text-gray-700 mb-4">
            You agree to use GreenBroker only for lawful purposes and in a way that
            does not infringe upon the rights of others or restrict their use and
            enjoyment. Prohibited behavior includes:
          </p>
          <ul className="list-disc pl-5 text-gray-700 space-y-2 mb-4">
            <li>Harassing or causing distress or inconvenience to any person</li>
            <li>Obscene or offensive language or content</li>
            <li>Disrupting the normal flow of dialogue within our platform</li>
            <li>Attempting to gain unauthorized access to our systems</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Disclaimer
          </h2>
          <p className="text-gray-700 mb-4">
            GreenBroker is a platform for informational purposes only. We are not
            contractors, do not perform energy efficiency work, and do not make energy
            efficiency recommendations. Information provided on our platform is sourced
            from third parties and may be subject to change.
          </p>
          <p className="text-gray-700 mb-4">
            All information on GreenBroker is provided in good faith, however we make
            no representation or warranty of any kind, express or implied, regarding
            the accuracy, adequacy, validity, reliability, availability or
            completeness of any information on the site.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Limitation of Liability
          </h2>
          <p className="text-gray-700 mb-4">
            Under no circumstance shall GreenBroker, its suppliers, or any third
            parties mentioned on this site be liable for any damages or losses related
            to your use of the site or the information provided herein.
          </p>
          <p className="text-gray-700 mb-4">
            This includes, without limitation, liability for consequential, special,
            indirect, incidental or punitive damages, even if we have been told of the
            possibility of such damages.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact</h2>
          <p className="text-gray-700">
            If you have any questions about these Terms of Service, please contact us
            at support@greenbroker.com.
          </p>
        </section>
      </div>
    </div>
  );
}
