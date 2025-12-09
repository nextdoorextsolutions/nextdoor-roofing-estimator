import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface CallNowButtonProps {
  phoneNumber?: string;
  className?: string;
  variant?: "default" | "compact" | "hero";
}

export function CallNowButton({ 
  phoneNumber = "727-318-0006", 
  className,
  variant = "default" 
}: CallNowButtonProps) {
  const formattedPhone = phoneNumber.replace(/[^0-9]/g, "");
  
  if (variant === "compact") {
    return (
      <a
        href={`tel:+1${formattedPhone}`}
        className={cn(
          "group inline-flex items-center gap-2 px-4 py-2 rounded-xl",
          "bg-gradient-to-r from-teal-500 to-teal-600",
          "text-white font-semibold text-sm",
          "shadow-[0_0_15px_rgba(45,212,191,0.4)]",
          "hover:shadow-[0_0_25px_rgba(45,212,191,0.6)]",
          "transition-all duration-300",
          "hover:scale-105 active:scale-95",
          className
        )}
      >
        <Phone className="h-4 w-4 group-hover:animate-phone-ring" />
        <span>Call Now</span>
      </a>
    );
  }

  if (variant === "hero") {
    return (
      <a
        href={`tel:+1${formattedPhone}`}
        className={cn(
          "group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl overflow-hidden",
          "bg-gradient-to-r from-teal-500 via-teal-400 to-teal-500 bg-[length:200%_100%]",
          "text-white font-bold text-lg",
          "shadow-[0_0_30px_rgba(45,212,191,0.5),0_0_60px_rgba(45,212,191,0.3)]",
          "hover:shadow-[0_0_40px_rgba(45,212,191,0.7),0_0_80px_rgba(45,212,191,0.4)]",
          "transition-all duration-500",
          "hover:scale-105 active:scale-95",
          "animate-[gradient_3s_ease_infinite]",
          className
        )}
        style={{
          backgroundSize: "200% 100%",
          animation: "gradient 3s ease infinite"
        }}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        
        {/* Phone icon with ring animation */}
        <div className="relative">
          <Phone className="h-6 w-6 group-hover:animate-phone-ring" />
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-full bg-white/30 animate-ping opacity-0 group-hover:opacity-100" />
        </div>
        
        <div className="flex flex-col items-start">
          <span className="text-xs opacity-80">Call Now - Free Estimate</span>
          <span className="text-xl tracking-wide">{phoneNumber}</span>
        </div>
      </a>
    );
  }

  // Default variant
  return (
    <a
      href={`tel:+1${formattedPhone}`}
      className={cn(
        "group relative inline-flex items-center gap-3 px-6 py-3 rounded-xl overflow-hidden",
        // Glassmorphism background
        "bg-slate-900/80 backdrop-blur-xl border border-white/10",
        // Text styling
        "text-white font-semibold",
        // Neon glow effect
        "shadow-[0_0_20px_rgba(45,212,191,0.4),inset_0_0_20px_rgba(45,212,191,0.1)]",
        "hover:shadow-[0_0_30px_rgba(45,212,191,0.6),inset_0_0_30px_rgba(45,212,191,0.2)]",
        // Transitions
        "transition-all duration-300",
        "hover:scale-105 active:scale-95",
        className
      )}
    >
      {/* Animated border gradient */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-500/0 via-teal-500/50 to-teal-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ padding: '1px', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />
      
      {/* Phone icon */}
      <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 shadow-[0_0_15px_rgba(45,212,191,0.5)]">
        <Phone className="h-5 w-5 text-white group-hover:animate-phone-ring" />
      </div>
      
      {/* Text content */}
      <div className="flex flex-col">
        <span className="text-xs text-teal-400 uppercase tracking-wider">Call Now</span>
        <span className="text-lg font-bold text-white tracking-wide">{phoneNumber}</span>
      </div>
      
      {/* Shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
    </a>
  );
}
