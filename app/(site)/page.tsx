import Hero from "@/components/hero/Hero";
import Service from "@/components/sections/Service";
import Menu from "@/components/sections/Menu";
import Pantry from "@/components/sections/Pantry";
import Industries from "@/components/sections/Industries";
import Machines from "@/components/sections/Machines";
import MachineRow from "@/components/sections/MachineRow";
import Cases from "@/components/sections/Cases";
import Story from "@/components/sections/Story";
import Pricing from "@/components/sections/Pricing";
import Blog from "@/components/sections/Blog";
import Ticker from "@/components/ui/Ticker";
import JsonLd from "@/components/seo/JsonLd";

export default function Home() {
  return (
    <>
      {/* The structured data for this route, edited in the SEO panel. Renders
      nothing unless something has been written there. */}
      <JsonLd path="/" />
      <Hero />
      <Service />
      <Menu />
      <Pantry />
      <Industries />
      <Machines />
      <MachineRow />
      <Cases />
      <Story />
      <Pricing />
      <Blog />
      {/* the sign-off band, between the last section and the footer */}
      <Ticker />
    </>
  );
}
