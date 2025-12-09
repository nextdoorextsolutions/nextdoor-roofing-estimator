import { CloudLightning, FileText, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StormDamageCTA() {
  return (
    <section className="py-16 bg-gradient-to-r from-amber-600 via-orange-500 to-red-500 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full">
          {Array.from({ length: 20 }).map((_, i) => (
            <CloudLightning
              key={i}
              className="absolute text-white"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${30 + Math.random() * 40}px`,
                height: `${30 + Math.random() * 40}px`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left Content */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
              <CloudLightning className="h-8 w-8 text-white" />
              <span className="text-white/90 font-semibold uppercase tracking-wider text-sm">
                Storm Damage?
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Get Your Free Damage Report
            </h2>
            <p className="text-white/90 text-lg max-w-xl">
              Our certified inspectors will assess your roof for storm damage and help you 
              navigate the insurance claim process. No cost, no obligation.
            </p>
            
            {/* Benefits */}
            <div className="flex flex-wrap gap-4 mt-6 justify-center md:justify-start">
              <div className="flex items-center gap-2 text-white/90">
                <Shield className="h-5 w-5" />
                <span>Insurance Claim Assistance</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <FileText className="h-5 w-5" />
                <span>Detailed Documentation</span>
              </div>
            </div>
          </div>

          {/* Right CTA */}
          <div className="flex-shrink-0">
            <a
              href="https://nextdoorstormdocs.pro"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                size="lg"
                className="h-16 px-8 text-lg font-bold bg-white text-orange-600 hover:bg-gray-100 hover:text-orange-700 shadow-2xl hover:shadow-white/20 transition-all duration-300 group"
              >
                <FileText className="mr-2 h-6 w-6" />
                Set Up My Free Damage Report
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
            <p className="text-white/70 text-sm text-center mt-3">
              100% Free • No Obligation • Fast Response
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
