import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTranslation } from "react-i18next";

export function FaqSection() {
  const { t } = useTranslation();

  return (
    <section className="py-24 bg-secondary/30 border-t border-border/60">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Got Questions?</p>
          <h2 className="font-display text-3xl sm:text-4xl tracking-tight font-medium">
            Frequently Asked Questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          <AccordionItem value="item-1" className="border border-border bg-card rounded-xl px-6 data-[state=open]:shadow-md transition-all">
            <AccordionTrigger className="text-left font-medium text-[15px] hover:no-underline py-5">
              How does the Voice AI work?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed text-sm pb-5">
              It’s incredibly simple. You tap the Voice Orb and just talk to Linnea like a normal human. She asks you questions about your background in your native language, listens to your answers, and instantly translates and formats them into a perfect English resume in real-time.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2" className="border border-border bg-card rounded-xl px-6 data-[state=open]:shadow-md transition-all">
            <AccordionTrigger className="text-left font-medium text-[15px] hover:no-underline py-5">
              Will this pass ATS (Applicant Tracking System) scanners?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed text-sm pb-5">
              Yes, absolutely. Our templates are meticulously engineered from the ground up to be 100% ATS-friendly. They use clean underlying code and standard semantic formatting that automated HR bots can parse effortlessly without hallucinating data.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="border border-border bg-card rounded-xl px-6 data-[state=open]:shadow-md transition-all">
            <AccordionTrigger className="text-left font-medium text-[15px] hover:no-underline py-5">
              Can I edit the PDF later?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed text-sm pb-5">
              Yes! Your resume remains fully editable in our dashboard. You can return at any time to add new experiences, tweak text, or switch templates with a single click. When you unlock a premium version, you keep full editing rights forever.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-4" className="border border-border bg-card rounded-xl px-6 data-[state=open]:shadow-md transition-all">
            <AccordionTrigger className="text-left font-medium text-[15px] hover:no-underline py-5">
              Do I have to speak English?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed text-sm pb-5">
              Not at all! That is the magic of resume-zen Ai. You can speak in Hindi, Tamil, Spanish, French, or 10+ other languages. Linnea understands you perfectly and does the heavy lifting of writing a flawless English resume for you.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
