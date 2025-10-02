import { Suspense } from "react";
export const dynamic = 'force-dynamic';
import { AddGuardianForm } from "@/components/AddGuardianForm";
import { GuardiansList } from "@/components/GuardiansList";
import { Shield, Loader2 } from "lucide-react";

function GuardiansListLoading() {
  return (
    <div className="flex items-center justify-center py-2xl">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function GuardiansPage() {
  return (
    <div className="max-w-4xl mx-auto p-lg space-y-2xl">
      {/* Page Header */}
      <div className="text-center space-y-md">
        <div className="flex items-center justify-center gap-sm">
          <div className="p-md bg-background rounded-lg">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-h1 text-text-dark font-semibold">
            Moji Strážcovia (Guardians)
          </h1>
        </div>
        <p className="text-body text-text-light max-w-2xl mx-auto">
          Pridajte dôveryhodné osoby, ktoré budú môcť pristupovať k vašim dokumentom a informáciám v prípade potreby.
        </p>
      </div>

      {/* Add Guardian Form */}
      <section>
        <AddGuardianForm />
      </section>

      {/* Divider */}
      <div className="border-t border-border"></div>

      {/* Guardians List */}
      <section className="space-y-md">
        <h2 className="text-h2 text-text-dark font-medium">
          Vaši Strážcovia
        </h2>
        <Suspense fallback={<GuardiansListLoading />}>
          <GuardiansList />
        </Suspense>
      </section>
    </div>
  );
}