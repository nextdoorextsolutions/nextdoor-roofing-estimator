import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

/**
 * Placeholder for the retired estimator admin page.
 *
 * The old /admin read leads out of the standalone backend's MySQL database.
 * Estimator leads now land in the CRM's report_requests table with
 * leadSource="estimator", so there is one lead list instead of two that drift.
 *
 * pages/AdminDashboard.tsx is left in the tree for reference until the Render
 * service and its MySQL database are decommissioned — see DECOMMISSION.md.
 */
export function AdminMoved() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-5">
        <h1 className="text-2xl font-bold">This dashboard has moved</h1>
        <p className="text-muted-foreground">
          Estimator leads now go straight into the CRM, alongside every other lead — with the roof
          measurement, how it was measured, and the prices the homeowner saw.
        </p>
        <Button asChild size="lg">
          <a href="https://www.ndespanels.com/crm/leads" target="_blank" rel="noreferrer">
            Open the CRM <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}
