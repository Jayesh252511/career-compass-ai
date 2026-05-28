import { GlobalStandard } from "./global-standard";
import { ExecutiveElite } from "./executive-elite";
import { FaangProfessional } from "./faang-professional";
import { ModernCorporate } from "./modern-corporate";
import { StartupMinimal } from "./startup-minimal";
import { ProductDesigner } from "./product-designer";
import { InvestmentBanking } from "./investment-banking";
import { AcademicResearch } from "./academic-research";
import { FresherSmart } from "./fresher-smart";
import { CreativeProfessional } from "./creative-professional";

import type { TemplateType } from "@/lib/constants";
import type { ResumeContent } from "@/lib/constants";
import type { ResumeSectionLabels } from "@/lib/resume/section-labels";
import { FC } from "react";

export type TemplateProps = {
  c: ResumeContent;
  labels?: ResumeSectionLabels;
};

export const TEMPLATE_COMPONENTS: Record<TemplateType, FC<TemplateProps>> = {
  "global-standard": GlobalStandard,
  "executive-elite": ExecutiveElite,
  "faang-professional": FaangProfessional,
  "modern-corporate": ModernCorporate,
  "startup-minimal": StartupMinimal,
  "product-designer": ProductDesigner,
  "investment-banking": InvestmentBanking,
  "academic-research": AcademicResearch,
  "fresher-smart": FresherSmart,
  "creative-professional": CreativeProfessional,
};
