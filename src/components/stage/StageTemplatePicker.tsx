import { cn } from "@/lib/utils";

export type StageTemplate = "spotlight" | "neon" | "cyber" | "galaxy";

interface StageTemplatePickerProps {
  selected: StageTemplate;
  onSelect: (t: StageTemplate) => void;
}

const TEMPLATES: { id: StageTemplate; label: string; gradient: string }[] = [
  { id: "spotlight", label: "Spotlight", gradient: "from-zinc-900 to-zinc-800" },
  { id: "neon", label: "Neon Stage", gradient: "from-purple-900 via-pink-900 to-purple-900" },
  { id: "cyber", label: "Cyber Club", gradient: "from-cyan-900 via-blue-900 to-indigo-900" },
  { id: "galaxy", label: "Galaxy", gradient: "from-indigo-950 via-purple-950 to-pink-950" },
];

export function StageTemplatePicker({ selected, onSelect }: StageTemplatePickerProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {TEMPLATES.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={cn(
            "flex-shrink-0 w-20 h-14 rounded-lg bg-gradient-to-br flex items-center justify-center text-xs font-medium text-white border-2 transition-all",
            t.gradient,
            selected === t.id ? "border-primary shadow-lg shadow-primary/30 scale-105" : "border-transparent opacity-70 hover:opacity-100"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Get CSS gradient classes for a template */
export function getTemplateGradient(template: StageTemplate): string {
  return TEMPLATES.find((t) => t.id === template)?.gradient ?? TEMPLATES[0].gradient;
}
