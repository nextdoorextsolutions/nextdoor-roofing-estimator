import { Check, User, Calendar, FileText, Home, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export type PipelineStatus = "prospect" | "lead" | "appointment" | "proposal" | "closed";

interface SalesPipelineProps {
  currentStatus: PipelineStatus;
  onStatusChange?: (status: PipelineStatus) => void;
}

const stages: { id: PipelineStatus; label: string; icon: React.ElementType }[] = [
  { id: "prospect", label: "Prospect", icon: User },
  { id: "lead", label: "Lead", icon: FileText },
  { id: "appointment", label: "Appointment", icon: Calendar },
  { id: "proposal", label: "Proposal", icon: FileText },
  { id: "closed", label: "Closed Deal", icon: Home },
];

const statusOrder: PipelineStatus[] = ["prospect", "lead", "appointment", "proposal", "closed"];

export function SalesPipeline({ currentStatus, onStatusChange }: SalesPipelineProps) {
  const currentIndex = statusOrder.indexOf(currentStatus);

  const getStageState = (stageIndex: number) => {
    if (stageIndex < currentIndex) return "completed";
    if (stageIndex === currentIndex) return "active";
    return "future";
  };

  return (
    <div className="w-full py-6">
      {/* Glassmorphism Container */}
      <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        {/* Pipeline Track */}
        <div className="relative flex items-center justify-between">
          {/* Connecting Lines */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-slate-700/50 rounded-full" />
          
          {/* Completed Progress Line */}
          <div 
            className="absolute top-6 left-0 h-1 bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: `${(currentIndex / (stages.length - 1)) * 100}%`,
              boxShadow: '0 0 15px rgba(45, 212, 191, 0.6)'
            }}
          />

          {/* Stage Nodes */}
          {stages.map((stage, index) => {
            const state = getStageState(index);
            const Icon = stage.icon;
            const isClosedDeal = stage.id === "closed";

            return (
              <div
                key={stage.id}
                className="relative z-10 flex flex-col items-center"
                onClick={() => onStatusChange?.(stage.id)}
              >
                {/* Closed Deal Special Icon */}
                {isClosedDeal && (
                  <div className={cn(
                    "absolute -top-8 flex items-center gap-1 text-xs font-semibold transition-all duration-300",
                    state === "active" ? "text-amber-400 animate-pulse" : "text-amber-500/50"
                  )}>
                    <Home className="h-3 w-3" />
                    <DollarSign className="h-3 w-3" />
                  </div>
                )}

                {/* Node Circle */}
                <button
                  className={cn(
                    "relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer",
                    // Completed State
                    state === "completed" && "bg-teal-500 text-white shadow-[0_0_15px_rgba(45,212,191,0.5)]",
                    // Active State - Neon Glow
                    state === "active" && !isClosedDeal && [
                      "bg-teal-500 text-white",
                      "shadow-[0_0_20px_rgba(45,212,191,0.7),0_0_40px_rgba(45,212,191,0.4)]",
                      "ring-2 ring-teal-400/50",
                      "animate-pulse"
                    ],
                    // Active Closed Deal - Golden Pulsing
                    state === "active" && isClosedDeal && [
                      "bg-gradient-to-br from-amber-400 to-amber-600 text-white",
                      "shadow-[0_0_25px_rgba(251,191,36,0.8),0_0_50px_rgba(251,191,36,0.4)]",
                      "ring-2 ring-amber-400/50",
                      "animate-[heartbeat_1.5s_ease-in-out_infinite]"
                    ],
                    // Future State - Inactive but visible
                    state === "future" && !isClosedDeal && "bg-slate-700/50 text-slate-400 border border-slate-600",
                    // Future Closed Deal - Golden hint
                    state === "future" && isClosedDeal && [
                      "bg-slate-700/50 text-amber-500/70 border border-amber-500/30",
                      "shadow-[0_0_10px_rgba(251,191,36,0.2)]"
                    ]
                  )}
                >
                  {state === "completed" ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </button>

                {/* Label */}
                <span className={cn(
                  "mt-3 text-xs font-medium transition-all duration-300 whitespace-nowrap",
                  state === "completed" && "text-teal-400",
                  state === "active" && !isClosedDeal && "text-teal-300 font-bold",
                  state === "active" && isClosedDeal && "text-amber-400 font-bold",
                  state === "future" && !isClosedDeal && "text-slate-500",
                  state === "future" && isClosedDeal && "text-amber-500/50"
                )}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Next Action Button */}
        {currentIndex < stages.length - 1 && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => onStatusChange?.(statusOrder[currentIndex + 1])}
              className={cn(
                "px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300",
                "bg-gradient-to-r from-teal-500 to-teal-600",
                "hover:from-teal-400 hover:to-teal-500",
                "shadow-[0_0_20px_rgba(45,212,191,0.4)]",
                "hover:shadow-[0_0_30px_rgba(45,212,191,0.6)]",
                "transform hover:scale-105 active:scale-95"
              )}
            >
              Advance to {stages[currentIndex + 1].label} →
            </button>
          </div>
        )}

        {/* Celebration for Closed Deal */}
        {currentStatus === "closed" && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-xl border border-amber-500/30">
              <span className="text-2xl">🎉</span>
              <span className="text-amber-400 font-bold">Deal Closed!</span>
              <span className="text-2xl">🎉</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
