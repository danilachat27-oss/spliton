import { AssetsPageShell } from "@/components/dashboard/assets/assets-page-shell";
import { CalculatorPageContent } from "@/components/dashboard/assets/calculator-page-content";
import { CalculatorPageHero } from "@/components/dashboard/assets/calculator-page-hero";
import { pageMeta } from "@/lib/i18n/page-metadata";

export const metadata = pageMeta("meta.calculator.title", "meta.calculator.description");

export default function AssetsCalculatorPage() {
  return (
    <AssetsPageShell>
      <div className="space-y-8 pb-8 sm:space-y-10 sm:pb-10">
        <CalculatorPageHero />
        <CalculatorPageContent />
      </div>
    </AssetsPageShell>
  );
}
