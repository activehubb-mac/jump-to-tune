import { Layout } from "@/components/layout/Layout";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Terms() {
  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="space-y-8">
            {/* Header */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-foreground">Terms of Service</h1>
              <p className="text-muted-foreground">Last updated: January 23, 2026</p>
            </div>

            {/* Content */}
            <ScrollArea className="h-auto">
              <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
                {/* Placeholder content - Replace with Termly content */}
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">1. Agreement to Terms</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    By accessing or using JumTunes, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">2. Use License</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Permission is granted to temporarily access the materials (information or software) on JumTunes for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">3. User Accounts</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">4. Music Ownership & Licensing</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    When you purchase music on JumTunes, you acquire a limited, non-exclusive license to access and play the purchased content. Artists retain all intellectual property rights to their music.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">5. Artist Terms</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Artists uploading content to JumTunes represent and warrant that they own or have the necessary licenses, rights, consents, and permissions to upload and distribute their content.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">6. Payments & Refunds</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    All purchases are processed securely through our payment partners. Refunds may be issued at our discretion for qualifying circumstances as outlined in our refund policy.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">7. Prohibited Activities</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    You may not use JumTunes for any illegal purpose, to violate any laws, to infringe upon or violate our intellectual property rights or the intellectual property rights of others.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">8. Termination</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">9. Limitation of Liability</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    In no event shall JumTunes, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">10. Contact Us</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    If you have any questions about these Terms, please contact us at legal@jumtunes.com.
                  </p>
                </section>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </Layout>
  );
}
