import { Hero } from "@/components/home/Hero";
import { AmericanStandardRail } from "@/components/home/AmericanStandardRail";
import { About } from "@/components/home/About";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Testimonials } from "@/components/home/Testimonials";
import { CTA } from "@/components/home/CTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <AmericanStandardRail />
      <About />
      <FeaturedProducts />
      <Testimonials />
      <CTA />
    </>
  );
}
