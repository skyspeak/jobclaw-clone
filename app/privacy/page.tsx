import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Privacy & communications consent — ${BRAND_NAME}`,
  description:
    "Privacy policy, email consent, and phone/SMS consent for dear[CC], a New Work Foundation tool.",
};

const LAST_UPDATED = "June 29, 2026";
const CONTACT_EMAIL = "privacy@dearcc.org";
const ORG_NAME = "New Work Foundation";
const ORG_URL = "https://dearcc.org";

export default function PrivacyPage() {
  return (
    <main className="min-h-[100dvh] brand-bg px-4 py-6 sm:px-8">
      <article className="mx-auto w-full max-w-3xl pb-24">
        <header className="mb-10 flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <Link
              className="text-sm font-bold tracking-tight text-foreground underline-offset-4 hover:underline"
              href="/"
            >
              {BRAND_NAME}
            </Link>
            <Button variant="outline" asChild size="sm" className="rounded-xl">
              <Link href="/">Back to home</Link>
            </Button>
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Privacy &amp; communications consent
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Last updated {LAST_UPDATED}. {BRAND_NAME} is operated by {ORG_NAME}, a nonprofit.
            </p>
          </div>

          <nav
            aria-label="On this page"
            className="rounded-2xl border border-border/70 bg-card/60 p-4 text-sm"
          >
            <p className="font-semibold text-foreground">On this page</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>
                <a className="underline-offset-4 hover:text-foreground hover:underline" href="#privacy-policy">
                  Privacy policy
                </a>
              </li>
              <li>
                <a className="underline-offset-4 hover:text-foreground hover:underline" href="#email-consent">
                  Email consent
                </a>
              </li>
              <li>
                <a
                  className="underline-offset-4 hover:text-foreground hover:underline"
                  href="#phone-consent"
                >
                  Phone &amp; SMS consent
                </a>
              </li>
            </ul>
          </nav>
        </header>

        <div className="prose prose-neutral max-w-none dark:prose-invert prose-headings:scroll-mt-24 prose-a:text-primary">
          <section id="privacy-policy">
            <h2>Privacy policy</h2>
            <p>
              This privacy policy describes how {ORG_NAME} (&quot;we,&quot; &quot;us,&quot; or
              &quot;our&quot;) collects, uses, and protects information when you use {BRAND_NAME}{" "}
              (&quot;the Service&quot;).
            </p>

            <h3>Information we collect</h3>
            <p>Depending on how you use the Service, we may collect:</p>
            <ul>
              <li>
                <strong>Contact information</strong> — such as your name, email address, and phone
                number when you sign up or request help.
              </li>
              <li>
                <strong>Profile and career information</strong> — such as education, work history,
                skills, preferences, and materials you choose to share (for example, a resume or
                LinkedIn profile).
              </li>
              <li>
                <strong>Usage data</strong> — such as pages visited, features used, and basic
                technical information (browser type, device type, and similar diagnostics).
              </li>
              <li>
                <strong>Communications</strong> — messages you send us and our replies, including
                support requests and survey responses.
              </li>
            </ul>

            <h3>How we use your information</h3>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, operate, and improve the Service.</li>
              <li>Personalize career guidance, job-search help, and related content.</li>
              <li>Send updates you have asked to receive (see email and phone consent below).</li>
              <li>Respond to your questions and provide customer support.</li>
              <li>Understand how the Service is used so we can make it better.</li>
              <li>Protect the security and integrity of the Service and our users.</li>
              <li>Comply with applicable law.</li>
            </ul>

            <h3>We do not sell your data</h3>
            <p>
              We do <strong>not</strong> sell, rent, or trade your personal information to third
              parties for their marketing purposes. We do not share your data with data brokers. Our
              mission is to help people navigate their careers — not to monetize your information.
            </p>

            <h3>Service providers</h3>
            <p>
              We may use trusted third-party vendors to host the Service, send email, deliver SMS
              messages, store data, or provide analytics. These providers may only use your
              information to perform services on our behalf and are required to protect it
              appropriately.
            </p>

            <h3>Data retention</h3>
            <p>
              We keep your information only as long as needed to provide the Service, fulfill the
              purposes described in this policy, or comply with legal obligations. You may request
              deletion of your account or contact information at any time (see &quot;Your
              choices&quot; below).
            </p>

            <h3>Security</h3>
            <p>
              We use reasonable administrative, technical, and organizational safeguards designed to
              protect your information. No method of transmission or storage is completely secure,
              but we work to reduce risk and respond to issues promptly.
            </p>

            <h3>Your choices</h3>
            <p>You can:</p>
            <ul>
              <li>Opt out of marketing emails using the unsubscribe link in any message.</li>
              <li>Opt out of SMS by replying STOP to any text we send (see phone consent below).</li>
              <li>Request access to, correction of, or deletion of your personal information.</li>
              <li>Withdraw consent where processing is based on consent.</li>
            </ul>
            <p>
              To exercise these rights, email us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>

            <h3>Children</h3>
            <p>
              The Service is intended for people who can lawfully enter into agreements in their
              jurisdiction. We do not knowingly collect personal information from children under 13
              without appropriate parental consent. If you believe we have collected such
              information, please contact us and we will delete it.
            </p>

            <h3>Changes</h3>
            <p>
              We may update this policy from time to time. We will post the revised version on this
              page and update the &quot;Last updated&quot; date. Material changes may also be
              communicated by email or a notice on the Service where appropriate.
            </p>
          </section>

          <section id="email-consent">
            <h2>Email consent</h2>
            <p>
              When you provide your email address and agree to be contacted, you consent to receive
              email from {BRAND_NAME} and {ORG_NAME} about:
            </p>
            <ul>
              <li>Job-search guidance, career coaching, and related program updates.</li>
              <li>
                <strong>StayRelevant</strong> — our weekly AI and career newsletter personalized to
                your role (typically sent on Sundays, about 15 minutes of reading).
              </li>
              <li>Account, security, and transactional messages related to your use of the Service.</li>
            </ul>

            <h3>What you are agreeing to</h3>
            <p>By checking the email consent box (or otherwise opting in), you confirm that:</p>
            <ul>
              <li>You are the owner of the email address you provide, or you have permission to use it.</li>
              <li>
                You agree to receive the communications described above at that address.
              </li>
              <li>
                Consent is not a condition of purchasing any goods or services (the Service is free).
              </li>
            </ul>

            <h3>How to unsubscribe</h3>
            <p>
              You may withdraw email consent at any time by clicking &quot;unsubscribe&quot; in any
              marketing email or by emailing <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
              You may still receive essential service or legal notices related to your account even
              after opting out of marketing email.
            </p>
          </section>

          <section id="phone-consent">
            <h2>Phone &amp; SMS consent</h2>
            <p>
              When you provide your phone number and agree to be contacted, you consent to receive
              calls and text messages (SMS/MMS) from {BRAND_NAME} and {ORG_NAME} about job-search
              help, program updates, reminders, and related support.
            </p>

            <h3>What you are agreeing to</h3>
            <p>By checking the phone consent box (or otherwise opting in), you confirm that:</p>
            <ul>
              <li>
                You are the subscriber or authorized user of the phone number you provide.
              </li>
              <li>
                You agree to receive autodialed and non-autodialed calls and texts at that number.
              </li>
              <li>
                Message frequency varies. Message and data rates may apply depending on your carrier
                and plan.
              </li>
              <li>
                Consent is not a condition of purchasing any goods or services (the Service is free).
              </li>
            </ul>

            <h3>How to opt out</h3>
            <p>
              You may stop text messages at any time by replying <strong>STOP</strong> to any
              message we send. For help, reply <strong>HELP</strong> or email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. You may also request to be
              removed from our call list by emailing us. Opting out of texts does not remove you
              from email communications unless you unsubscribe from those separately.
            </p>

            <h3>Carriers</h3>
            <p>
              Carriers are not liable for delayed or undelivered messages. Supported carriers may
              vary; contact your carrier with questions about your mobile plan.
            </p>
          </section>

          <section>
            <h2>Contact us</h2>
            <p>
              Questions about this policy or your data? Reach {ORG_NAME} at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or visit{" "}
              <a href={ORG_URL} rel="noopener noreferrer" target="_blank">
                {ORG_URL}
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
