import { Layout } from "@/components/layout/Layout";
import { useState } from "react";
import { ExternalLink } from "lucide-react";

const TERMLY_URL = "https://app.termly.io/policy-viewer/policy.html?policyUUID=7ab0d082-f2d6-4d35-a392-28736c10547f";

export default function Terms() {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  return (
    <Layout>
      <div className="w-full bg-background" style={{ minHeight: "100vh" }}>
        {!iframeLoaded && !iframeError && (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Loading Terms and Conditions...</p>
          </div>
        )}

        {iframeError && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-muted-foreground">Unable to load terms inline.</p>
            <a href={TERMLY_URL} target="_blank" rel="noopener noreferrer"
               className="text-primary flex items-center gap-2 underline">
              View Terms and Conditions <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        {!iframeError && (
          <iframe
            src={TERMLY_URL}
            title="Terms and Conditions"
            onLoad={() => setIframeLoaded(true)}
            onError={() => setIframeError(true)}
            style={{
              width: "100%",
              height: "100vh",
              border: "none",
              display: iframeLoaded ? "block" : "none",
              colorScheme: "light",
            }}
            sandbox="allow-scripts allow-same-origin allow-popups"
            allowFullScreen
          />
        )}
      </div>
    </Layout>
  );
}
