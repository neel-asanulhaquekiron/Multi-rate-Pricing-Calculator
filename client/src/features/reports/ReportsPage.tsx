import { useState } from "react";
import { formatMoney } from "shared";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import { monthStartYmd, todayYmd } from "@/lib/localDate";
import { useLoad } from "@/lib/useLoad";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Field } from "@/components/Field";

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

  // Invalid ranges reject locally through the same error path the API uses —
  // one rendering pipeline, zero wasted requests.
  const { state } = useLoad(() => {
    if (from === "" || to === "") {
      return Promise.reject(new ApiError(400, "VALIDATION_ERROR", "select both dates"));
    }
    if (from > to) {
      return Promise.reject(new ApiError(400, "VALIDATION_ERROR", "'from' must be on or before 'to'"));
    }
    return api.get<{ summary: ReportSummary }>(`/api/reports/summary?from=${from}&to=${to}`).then((res) => res.summary);
  }, [from, to]);

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
      </div>

      {state.status === "loading" && <Skeleton className="h-24 w-full" />}

      {state.status === "error" && <ErrorAlert message={state.message} />}

      {state.status === "ready" && (
        /* Temporary rendering — replaced by StatCards in 6.5.3 */
        <p className="text-sm text-muted-foreground">
          {state.data.documentCount} documents · grand total ${formatMoney(state.data.grandTotalCents)} · tax $
          {formatMoney(state.data.taxCents)} · discount ${formatMoney(state.data.discountCents)}
        </p>
      )}
    </div>
  );
};
