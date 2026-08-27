import Hero from "@/components/hero/Hero";
import Service from "@/components/sections/Service";
import Menu from "@/components/sections/Menu";
import Industries from "@/components/sections/Industries";
import Machines from "@/components/sections/Machines";
import MachineRow from "@/components/sections/MachineRow";
import Cases from "@/components/sections/Cases";
import Pricing from "@/components/sections/Pricing";
import Blog from "@/components/sections/Blog";
import Ticker from "@/components/ui/Ticker";

export default function Home() {
  return (
    <>
      <Hero />
      <Service />
      <Menu />
      <Industries />
      <Machines />
      <MachineRow />
      <Cases />
      <Pricing />
      <Blog />
      {/* the sign-off band, between the last section and the footer */}
      <Ticker />
    </>
  );
}
