import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { FinalCta } from "@/components/landing/FinalCta";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { ProductSpotlight } from "@/components/landing/ProductSpotlight";
import "@/styles/landing.css";

export default function Landing() {
  return (
    <div className="landing-page min-h-screen bg-background text-foreground">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <LandingNav />
      <main id="main-content" tabIndex={-1}>
        <HeroSection />
        <FeatureShowcase />
        <HowItWorks />
        <ProductSpotlight />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
