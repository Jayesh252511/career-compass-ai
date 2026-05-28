import React, { useState, useRef, useEffect } from "react";
import { GlobalStandard } from "@/components/templates/global-standard";
import { type ResumeContent } from "@/lib/constants";
import { MoveHorizontal } from "lucide-react";

const MOCK_RESUME: ResumeContent = {
  fullName: "Jane Doe",
  headline: "Senior Software Engineer",
  email: "jane.doe@example.com",
  phone: "(555) 123-4567",
  location: "San Francisco, CA",
  links: [
    { label: "LinkedIn", url: "https://linkedin.com/in/janedoe" },
    { label: "GitHub", url: "https://github.com/janedoe" }
  ],
  summary: "Results-driven Software Engineer with 8+ years of experience in designing, developing, and deploying scalable web applications. Proven ability to lead cross-functional teams and drive technical architecture decisions. Passionate about performance optimization and building resilient systems.",
  experience: [
    {
      title: "Senior Software Engineer",
      company: "TechNova Solutions",
      location: "San Francisco, CA",
      start: "Jan 2020",
      end: "Present",
      bullets: [
        "Architected and migrated legacy monolith to microservices using Node.js and Docker, improving system uptime to 99.99%.",
        "Led a team of 5 engineers to deliver a new real-time analytics dashboard, increasing user engagement by 35%.",
        "Optimized database queries in PostgreSQL, reducing average API response times by over 40%."
      ]
    },
    {
      title: "Software Engineer",
      company: "Innovate AI",
      location: "Austin, TX",
      start: "Mar 2016",
      end: "Dec 2019",
      bullets: [
        "Developed and maintained RESTful APIs using Python and Django for a highly scalable machine learning platform.",
        "Implemented Redis caching layer that reduced database load by 60% during peak traffic hours.",
        "Collaborated closely with product managers to define technical requirements and sprint goals."
      ]
    }
  ],
  education: [
    {
      degree: "B.S. in Computer Science",
      school: "University of Texas at Austin",
      location: "Austin, TX",
      start: "Aug 2012",
      end: "May 2016"
    }
  ],
  skills: ["JavaScript (ES6+)", "TypeScript", "React", "Node.js", "Python", "Docker", "AWS", "PostgreSQL"],
  projects: [],
  languages: [],
  certifications: []
};

const MESSY_TEXT = `
jane doe
software developer
jane.doe@example.com / 555-123-4567
san francisco ca
linkedin: /in/janedoe
github: /janedoe

summary
im a software engineer with 8 yrs of experience. i make web apps and like leading teams. i like making things fast.

experience
technova solutions - senior software engineer
san francisco
2020 - now
- i moved our old app to microservices with node and docker. uptime is 99.99% now.
- i lead 5 guys to make an analytics dashboard which made users use it 35% more.
- made postgres faster by 40%

innovate ai - software engineer
austin tx
2016 - 2019
- made APIs with python django
- added redis caching to make db load go down by 60%
- worked with PMs

education
bs computer science
UT austin
2012-2016

skills:
js, ts, react, node, python, docker, aws, postgres
`;

export function BeforeAfterSlider() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  // Allow clicking anywhere to move slider instantly, then start drag
  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleMove(e.clientX);
  };
  
  const onTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchend", handleMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden cursor-ew-resize shadow-2xl border border-border select-none"
      onMouseMove={onMouseMove}
      onTouchMove={onTouchMove}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* LEFT: Before (Messy Text) */}
      <div className="absolute inset-0 bg-[#f8f9fa] text-neutral-800 p-6 sm:p-10 font-mono text-xs sm:text-sm whitespace-pre-wrap leading-relaxed overflow-hidden flex items-center justify-start pointer-events-none">
        <div className="max-w-[400px] opacity-70">
          <div className="text-xl font-bold mb-4 font-sans text-neutral-400 uppercase tracking-widest">Before</div>
          {MESSY_TEXT.trim()}
        </div>
      </div>

      {/* RIGHT: After (Beautiful Rendered Resume) */}
      <div 
        className="absolute inset-0 bg-neutral-100 pointer-events-none overflow-hidden"
        style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
      >
        <div className="absolute top-6 sm:top-10 right-6 sm:right-10 z-20 text-xl font-bold font-sans text-primary uppercase tracking-widest drop-shadow-md">
          After
        </div>
        {/* We use scale to perfectly fit the A4 document into the container */}
        <div className="absolute top-1/2 left-[60%] sm:left-[70%] -translate-y-1/2 -translate-x-1/2 w-[800px] h-[1050px] scale-[0.35] sm:scale-[0.5] md:scale-[0.6] lg:scale-[0.7] origin-center bg-white shadow-xl">
          <GlobalStandard c={MOCK_RESUME} />
        </div>
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-primary/80 cursor-ew-resize z-30 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.2)]"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="h-10 w-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg transform -translate-x-1/2 transition-transform hover:scale-110">
          <MoveHorizontal className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
