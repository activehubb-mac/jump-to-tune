import { Layout } from "@/components/layout/Layout";

export default function Terms() {
  return (
    <Layout>
      <div className="w-full bg-background" style={{ minHeight: "100vh" }}>
        <iframe
          src="https://app.termly.io/policy-viewer/policy.html?policyUUID=7ab0d082-f2d6-4d35-a392-28736c10547f"
          title="Terms and Conditions"
          style={{
            width: "100%",
            height: "100vh",
            border: "none",
            display: "block",
          }}
          allowFullScreen
        />
      </div>
    </Layout>
  );
}
