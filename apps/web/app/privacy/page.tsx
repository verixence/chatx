export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5F3] to-[#F9E5DD] py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy for ChatX</h1>
        <p className="text-sm text-gray-600 mb-8">Last Updated: December 30, 2024</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
          <p className="text-gray-700 leading-relaxed">
            ChatX ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and web service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>

          <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Personal Information</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Account Information:</strong> Email address, name, and password when you create an account</li>
            <li><strong>User Content:</strong> Documents (PDFs), YouTube links, and text content you upload for AI analysis</li>
            <li><strong>Usage Data:</strong> Information about how you interact with the app, including chat histories, quiz results, and flashcard usage</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Automatically Collected Information</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Device Information:</strong> Device type, operating system, and app version</li>
            <li><strong>Log Data:</strong> IP address, access times, and error logs</li>
            <li><strong>Analytics:</strong> App performance metrics and feature usage statistics</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
          <p className="text-gray-700 leading-relaxed mb-3">We use your information to:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Provide and maintain the ChatX service</li>
            <li>Process your uploaded content with AI models</li>
            <li>Generate quizzes and flashcards based on your content</li>
            <li>Maintain chat history and user preferences</li>
            <li>Improve our services and user experience</li>
            <li>Send service-related notifications</li>
            <li>Provide customer support</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Services</h2>
          <p className="text-gray-700 leading-relaxed mb-3">ChatX integrates with the following third-party services:</p>

          <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">AI Services</h3>
          <p className="text-gray-700 leading-relaxed">
            We use AI service providers (OpenAI, Groq, or similar) to process your content and generate responses. Your content is sent to these services for processing but is not stored permanently by them.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Authentication</h3>
          <p className="text-gray-700 leading-relaxed">
            We use Supabase for secure user authentication and database management.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Content Processing</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>YouTube:</strong> When you provide YouTube links, we fetch video transcripts for AI analysis</li>
            <li><strong>PDF Processing:</strong> PDFs are processed locally and via our secure servers</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Storage and Security</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Your data is stored securely using industry-standard encryption</li>
            <li>Passwords are hashed and never stored in plain text</li>
            <li>Content is transmitted over secure HTTPS connections</li>
            <li>We implement appropriate security measures to protect against unauthorized access</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Account Data:</strong> Retained while your account is active</li>
            <li><strong>Content:</strong> Stored until you delete it or close your account</li>
            <li><strong>Chat History:</strong> Retained for your convenience; you can delete anytime</li>
            <li><strong>Backup Data:</strong> May be retained for up to 30 days after deletion</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
          <p className="text-gray-700 leading-relaxed mb-3">You have the right to:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and associated data</li>
            <li>Export your data</li>
            <li>Opt-out of marketing communications</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            To exercise these rights, contact us at <a href="mailto:support@verixence.com" className="text-blue-600 hover:underline">support@verixence.com</a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Children's Privacy</h2>
          <p className="text-gray-700 leading-relaxed">
            ChatX is not intended for users under 13 years of age. We do not knowingly collect information from children under 13. If you believe we have collected information from a child, please contact us immediately.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Sharing</h2>
          <p className="text-gray-700 leading-relaxed mb-3">We do not sell your personal information. We may share data:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>With AI service providers for content processing</li>
            <li>When required by law or legal process</li>
            <li>To protect our rights and prevent fraud</li>
            <li>With your explicit consent</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">International Data Transfers</h2>
          <p className="text-gray-700 leading-relaxed">
            Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
          <p className="text-gray-700 leading-relaxed">
            We may update this Privacy Policy periodically. We will notify you of significant changes via email or app notification. Continued use after changes constitutes acceptance.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
          <p className="text-gray-700 leading-relaxed">For privacy-related questions or concerns:</p>
          <ul className="list-none text-gray-700 space-y-2 mt-4">
            <li><strong>Email:</strong> <a href="mailto:support@verixence.com" className="text-blue-600 hover:underline">support@verixence.com</a></li>
            <li><strong>Website:</strong> <a href="https://chatx.verixence.com" className="text-blue-600 hover:underline">https://chatx.verixence.com</a></li>
            <li><strong>Company:</strong> Verixence Technologies</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your California Privacy Rights</h2>
          <p className="text-gray-700 leading-relaxed mb-3">California residents have additional rights under CCPA:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Right to know what personal information is collected</li>
            <li>Right to delete personal information</li>
            <li>Right to opt-out of sale (we don't sell data)</li>
            <li>Right to non-discrimination</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">GDPR Compliance (EU Users)</h2>
          <p className="text-gray-700 leading-relaxed mb-3">For EU users, we comply with GDPR:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Legal basis for processing: Consent and contract performance</li>
            <li>Data Protection Officer: <a href="mailto:privacy@verixence.com" className="text-blue-600 hover:underline">privacy@verixence.com</a></li>
            <li>Right to lodge complaints with supervisory authorities</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Breach Notification</h2>
          <p className="text-gray-700 leading-relaxed">
            In the event of a data breach, we will notify affected users within 72 hours via email and in-app notification.
          </p>
        </section>

        <hr className="my-8 border-gray-300" />

        <p className="text-gray-600 text-center italic">
          By using ChatX, you agree to this Privacy Policy.
        </p>
      </div>
    </div>
  );
}
