import React from "react";
import { TEMPLATES } from "@/lib/constants";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export function TemplateCarousel() {
  return (
    <section className="py-24 bg-background">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Beautiful Designs</p>
          <h2 className="font-display text-3xl sm:text-4xl tracking-tight font-medium">
            ATS-Friendly Templates
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Choose from our library of world-class, meticulously crafted templates. 
            Designed to pass automated scanners and impress human recruiters.
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full relative"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {TEMPLATES.map((tpl) => (
              <CarouselItem key={tpl.id} className="pl-2 md:pl-4 md:basis-1/3 lg:basis-1/4">
                <div className="group relative rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10">
                  <div className="aspect-[1/1.4] w-full bg-neutral-100 dark:bg-neutral-900 relative">
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-primary/5 to-primary/10">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                        <span className="text-primary font-bold text-xl">{tpl.name.charAt(0)}</span>
                      </div>
                      <h3 className="font-semibold text-foreground/90">{tpl.name}</h3>
                      <p className="text-xs text-muted-foreground mt-2">ATS-Optimized Layout</p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden sm:block">
            <CarouselPrevious className="-left-12" />
            <CarouselNext className="-right-12" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}
