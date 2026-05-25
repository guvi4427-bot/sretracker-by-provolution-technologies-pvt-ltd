import { Zap } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-[#0A0F1E] dark:to-[#1E3A5F] relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl gradient-blue flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Terms &amp; Conditions</h1>
        </div>

        <div className="glass-card p-6 sm:p-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
          <p className="text-xs text-muted-foreground">Last updated: March 4, 2026</p>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using the S/R/E Gamified Self-Growth Platform (&quot;Platform&quot;), you agree to be bound by these Terms and Conditions (&quot;Terms&quot;). If you do not agree to these Terms, please do not use the Platform. These Terms constitute a legally binding agreement between you and S/R/E.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. Description of Service</h2>
            <p>S/R/E is a gamified self-growth platform that helps users track and improve their Study (S), Routine (R), and Exercise (E) habits. The Platform provides features including but not limited to habit tracking, streak management, XP and leveling systems, social features, AI-powered assistance, fitness tracking, learning management, content creation tools, and time management features.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. User Accounts</h2>
            <p>You must create an account to use the Platform. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information when creating your account and update such information to keep it accurate and complete.</p>
            <p className="mt-2">You must be at least 13 years of age to use this Platform. If you are under 18, you must have parental or guardian consent to use the Platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. User Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Use the Platform for any unlawful purpose or in violation of any applicable laws</li>
              <li>Harass, bully, intimidate, or threaten other users</li>
              <li>Post content that is offensive, discriminatory, hateful, or explicit</li>
              <li>Impersonate another person or entity</li>
              <li>Attempt to gain unauthorized access to other users&apos; accounts or the Platform&apos;s systems</li>
              <li>Use automated scripts or bots to manipulate the Platform&apos;s gamification systems</li>
              <li>Share or distribute another user&apos;s personal information without consent</li>
              <li>Create multiple accounts for the purpose of manipulating the Platform</li>
              <li>Reverse-engineer, decompile, or disassemble any part of the Platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Content</h2>
            <p>You retain ownership of any content you submit, post, or display on or through the Platform. By posting content, you grant S/R/E a worldwide, non-exclusive, royalty-free license to use, reproduce, and distribute such content in connection with the Platform&apos;s services.</p>
            <p className="mt-2">You are solely responsible for the content you share. S/R/E reserves the right to remove any content that violates these Terms or our Community Guidelines.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Privacy</h2>
            <p>Your use of the Platform is also governed by our Privacy Policy, which describes how we collect, use, and share your information. By using the Platform, you consent to our collection and use of data as outlined in our Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Gamification &amp; Virtual Rewards</h2>
            <p>The Platform includes gamification features such as XP, levels, streaks, achievements, and leaderboards. These virtual rewards have no real monetary value and cannot be exchanged for cash or other real-world compensation. S/R/E reserves the right to modify, adjust, or reset gamification metrics at its discretion to maintain fairness and integrity of the system.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">8. AI-Powered Features</h2>
            <p>The Platform may use artificial intelligence to provide recommendations, insights, and assistance. AI-generated content may not always be accurate or appropriate. You should not rely solely on AI recommendations for health, fitness, or other critical decisions. Always consult qualified professionals for medical, nutritional, or psychological advice.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">9. Termination</h2>
            <p>S/R/E reserves the right to suspend or terminate your account at any time for violation of these Terms or for any other reason at our discretion. Upon termination, your right to use the Platform will immediately cease. Provisions of these Terms that by their nature should survive termination shall survive.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">10. Disclaimers</h2>
            <p>The Platform is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied. S/R/E does not warrant that the Platform will be uninterrupted, timely, secure, or error-free. Use of the Platform is at your own risk.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">11. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, S/R/E shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Platform. This includes, but is not limited to, damages for loss of data, goodwill, or other intangible losses.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">12. Changes to Terms</h2>
            <p>S/R/E may update these Terms from time to time. We will notify you of any material changes by posting the updated Terms on the Platform. Your continued use of the Platform after such changes constitutes your acceptance of the updated Terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">13. Contact</h2>
            <p>If you have any questions about these Terms, please contact us through the Platform&apos;s support channels.</p>
          </section>

          <div className="pt-4 border-t border-border">
            <Link href="/signup" className="text-blue-400 hover:underline text-sm">← Back to Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
