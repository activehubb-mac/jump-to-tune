import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, HelpCircle } from "lucide-react";

export default function PaymentCanceled() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-md mx-auto text-center">
          {/* Canceled Icon */}
          <div className="w-24 h-24 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-8">
            <XCircle className="w-12 h-12 text-muted-foreground" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-4">
            Payment Canceled
          </h1>

          <p className="text-muted-foreground mb-8">
            No worries! Your payment was canceled and you haven't been charged.
            You can try again whenever you're ready.
          </p>

          {/* Help Section */}
          <div className="glass-card p-6 mb-8 text-left">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <h2 className="font-semibold text-foreground mb-2">Need help?</h2>
                <p className="text-sm text-muted-foreground">
                  If you experienced any issues during checkout or have questions
                  about our plans, feel free to reach out to our support team.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" className="border-glass-border" asChild>
              <Link to="/browse">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Browse
              </Link>
            </Button>
            <Button className="gradient-accent neon-glow-subtle" asChild>
              <Link to="/collection">Go to Collection</Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
