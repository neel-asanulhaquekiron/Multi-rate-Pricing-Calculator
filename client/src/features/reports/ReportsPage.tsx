import { FileText, Lock, Percent, TicketPercent, Wallet } from "lucide-react";
import { useState } from "react";
import { formatMoney } from "shared";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { lastMonthRange, monthStartYmd, todayYmd, yearStartYmd } from "@/lib/localDate";
import { useLoad } from "@/lib/useLoad";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Field } from "@/components/Field";
import { StatCard } from "@/components/StatCard";

interface ReportSummary {
  documentCount: number;
  grandTotalCents: number;
  taxCents: number;
  discountCents: number;
}

export const ReportsPage = () => {
  // Defaults: the browser's current month so far (1st -> today).
  const [from, setFrom] = useState(monthStartYmd());
  const [to, setTo] = useState(todayYmd());
  const [finalizedOnly, setFinalizedOnly] = useState(false);

  const presets = [
    { label: "This month", from: monthStartYmd(), to: todayYmd() },
    { label: "Last month", ...lastMonthRange() },
    { label: "This year", from: yearStartYmd(), to: todayYmd() },
  ];

  // Invalid ranges reject locally through the same error path the API uses —
  // one rendering pipeline, zero wasted requests.
  const { state } = useLoad(() => {
    if (from === "" || to === "") {
      return Promise.reject(new ApiError(400, "VALIDATION_ERROR", "select both dates"));
    }
    if (from > to) {
      return Promise.reject(new ApiError(400, "VALIDATION_ERROR", "'from' must be on or before 'to'"));
    }
    const status = finalizedOnly ? "&status=finalized" : "";
    return api
      .get<{ summary: ReportSummary }>(`/api/reports/summary?from=${from}&to=${to}${status}`)
      .then((res) => res.summary);
  }, [from, to, finalizedOnly]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Report</h1>

      <div className="flex flex-wrap items-start gap-3">
        <div className="w-40">
          <Field id="report-from" label="From">
            <Input id="report-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </Field>
        </div>
        <div className="w-40">
          <Field id="report-to" label="To">
            <Input id="report-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </Field>
        </div>
        <div className="flex gap-2 self-end pb-px">
          {presets.map((preset) => {
            const active = from === preset.from && to === preset.to;
            return (
              <Button
                key={preset.label}
                variant={active ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  setFrom(preset.from);
                  setTo(preset.to);
                }}
              >
                {preset.label}
              </Button>
            );
          })}
          <Button
            variant={finalizedOnly ? "secondary" : "outline"}
            size="sm"
            aria-pressed={finalizedOnly}
            onClick={() => setFinalizedOnly((prev) => !prev)}
          >
            <Lock className="h-3.5 w-3.5" aria-hidden />
            Finalized only
          </Button>
        </div>
      </div>

      {state.status === "loading" && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      )}

      {state.status === "error" && <ErrorAlert message={state.message} />}

      {state.status === "ready" && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Documents" value={String(state.data.documentCount)} icon={FileText} />
            <StatCard label="Grand total" value={`$${formatMoney(state.data.grandTotalCents)}`} icon={Wallet} />
            <StatCard label="Total tax" value={`$${formatMoney(state.data.taxCents)}`} icon={Percent} />
            <StatCard label="Total discount" value={`$${formatMoney(state.data.discountCents)}`} icon={TicketPercent} />
          </div>
          {state.data.documentCount === 0 && (
            <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
              {finalizedOnly
                ? `No finalized documents were issued between ${from} and ${to} — totals are zero.`
                : `No documents were issued between ${from} and ${to} — totals are zero. Drafts count too, so try a wider range.`}
            </p>
          )}
        </>
      )}
    </div>
  );
};
