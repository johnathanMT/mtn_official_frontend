import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Myo Thant Naing.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main id="main" className="container-premium pt-32 pb-24 lg:pt-40 lg:pb-32">
      <span className="eyebrow">Get in touch</span>
      <h1 className="mt-4 text-4xl lg:text-6xl">Contact</h1>
      <p className="text-ink-muted mt-6 max-w-md text-lg">
        Scaffold only — the form and details land with the rest of the build.
      </p>
    </main>
  );
}
