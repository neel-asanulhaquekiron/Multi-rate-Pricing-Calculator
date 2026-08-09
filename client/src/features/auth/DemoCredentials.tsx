import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const DEMO_EMAIL = "demo@example.com";
export const DEMO_PASSWORD = "demo1234";

const CopyRow = ({ label, value }: { label: string; value: string }) => {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1">
        <code className="font-mono text-xs">{value}</code>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          aria-label={`copy ${label.toLowerCase()}`}
          onClick={onCopy}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-600" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
        </Button>
      </span>
    </div>
  );
};

/** Demo account hint on the login page — copyable credentials for reviewers. */
export const DemoCredentials = () => {
  return (
    <div className="space-y-1 rounded-md border bg-muted/50 p-3 text-sm">
      <p className="text-xs font-medium text-muted-foreground">Demo account</p>
      <CopyRow label="Email" value={DEMO_EMAIL} />
      <CopyRow label="Password" value={DEMO_PASSWORD} />
    </div>
  );
};
