import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Home, Layers, Loader2 } from "lucide-react";

/**
 * The NO_DATA path.
 *
 * Google has no satellite measurement for this roof, so we ask the homeowner
 * for the three inputs the backend needs to derive an area. This is a first
 * class branch of the funnel, not a consolation prize: it captures a lead
 * exactly like the measured path, through the same modal, into the same table.
 *
 * It is only ever reached when Solar genuinely has no building. An outage sends
 * the visitor to a retry screen instead — showing this form when our API key is
 * broken would quietly convert our fault into the homeowner doing data entry.
 */

export interface HomeownerAssistedAnswers {
  statedSqFt: number;
  stories: number;
  style: "simple" | "average" | "complex";
}

interface HomeownerAssistedFormProps {
  address: string;
  onSubmit: (answers: HomeownerAssistedAnswers) => void;
  isLoading?: boolean;
}

const STORY_OPTIONS = [
  { value: 1, label: "1 story" },
  { value: 1.5, label: "1½ stories" },
  { value: 2, label: "2 stories" },
];

const STYLE_OPTIONS: Array<{ value: HomeownerAssistedAnswers["style"]; label: string; hint: string }> = [
  { value: "simple", label: "Simple", hint: "One ridge, few angles" },
  { value: "average", label: "Average", hint: "Some hips or valleys" },
  { value: "complex", label: "Complex", hint: "Many angles, dormers" },
];

export function HomeownerAssistedForm({ address, onSubmit, isLoading }: HomeownerAssistedFormProps) {
  const [sqFt, setSqFt] = useState("");
  const [stories, setStories] = useState<number>(1);
  const [style, setStyle] = useState<HomeownerAssistedAnswers["style"]>("average");
  const [touched, setTouched] = useState(false);

  const parsedSqFt = Number(sqFt.replace(/[,\s]/g, ""));
  const sqFtValid = Number.isFinite(parsedSqFt) && parsedSqFt >= 200 && parsedSqFt <= 100_000;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!sqFtValid || isLoading) return;
    onSubmit({ statedSqFt: parsedSqFt, stories, style });
  };

  return (
    <Card className="max-w-xl mx-auto">
      <CardContent className="p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-foreground mb-1">A few quick questions</h2>
        <p className="text-sm text-muted-foreground mb-1">{address}</p>
        <p className="text-sm text-muted-foreground mb-6">
          We don't have a clear satellite image of this roof, so we'll size it from what you know about the
          home. Your estimate will be confirmed at your free inspection.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="sqft" className="flex items-center gap-2 mb-2">
              <Home className="w-4 h-4" /> Approximate home size (sq ft)
            </Label>
            <Input
              id="sqft"
              inputMode="numeric"
              placeholder="e.g. 1,850"
              value={sqFt}
              onChange={(event) => setSqFt(event.target.value)}
              aria-invalid={touched && !sqFtValid}
            />
            {touched && !sqFtValid && (
              <p className="text-xs text-destructive mt-1">Enter a home size between 200 and 100,000 sq ft.</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Living area, not lot size — it's usually on your property tax record.
            </p>
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4" /> Stories
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {STORY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStories(option.value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    stories === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input hover:bg-accent"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Roof shape</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {STYLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStyle(option.value)}
                  className={`rounded-lg border px-3 py-2 text-left transition ${
                    style === option.value
                      ? "border-primary bg-primary/10"
                      : "border-input hover:bg-accent"
                  }`}
                >
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="block text-xs text-muted-foreground">{option.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Preparing your estimate…
              </>
            ) : (
              "See my estimate"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
