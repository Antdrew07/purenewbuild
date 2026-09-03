import { Hero } from "@/components/home/Hero";
import { About } from "@/components/home/About";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Testimonials } from "@/components/home/Testimonials";
import { CTA } from "@/components/home/CTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <FeaturedProducts />
      <Testimonials />
      <CTA />
    </>
  );
}
