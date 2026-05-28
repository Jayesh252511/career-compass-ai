import React from "react";
import { Building2, Command, Hexagon, Component, Crown, Diamond, Dna, Fingerprint, Ghost, Orbit, Sparkle } from "lucide-react";

const logos = [
  { icon: Building2, name: "Acme Corp" },
  { icon: Command, name: "Stark Ind" },
  { icon: Hexagon, name: "Globex" },
  { icon: Component, name: "Initech" },
  { icon: Crown, name: "Wayne Ent" },
  { icon: Diamond, name: "Umbrella" },
  { icon: Dna, name: "Massive" },
  { icon: Fingerprint, name: "Cyberdyne" },
  { icon: Ghost, name: "Pac Corp" },
  { icon: Orbit, name: "Aperture" },
  { icon: Sparkle, name: "Sirius" }
];

export function TrustedMarquee() {
  return (
    <div className="w-full bg-secondary/30 border-y border-border/60 py-10 overflow-hidden flex flex-col items-center">
        <p className="text-sm sm:text-base font-medium text-muted-foreground text-center px-6 mb-8 max-w-2xl">
          Combine your talent with our resumes to stand out at top companies like:
        </p>
      
      <div className="relative w-full max-w-7xl mx-auto overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex w-max animate-scroll hover:[animation-play-state:paused] gap-12 sm:gap-24 items-center">
          {/* We render the array twice to create a seamless infinite scroll loop */}
          {[...logos, ...logos].map((Logo, idx) => (
            <div 
              key={idx} 
              className="flex items-center gap-2 text-muted-foreground/60 hover:text-foreground transition-colors duration-300 select-none grayscale opacity-60 hover:opacity-100 hover:grayscale-0"
            >
              <Logo.icon className="w-6 h-6 sm:w-8 sm:h-8" />
              <span className="font-display font-medium text-sm sm:text-base tracking-tight">{Logo.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
