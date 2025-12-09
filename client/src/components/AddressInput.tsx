import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, Search, ArrowRight } from "lucide-react";

const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

interface AddressInputProps {
  onAddressSelect: (address: string, placeId: string) => void;
  isLoading?: boolean;
}

export function AddressInput({ onAddressSelect, isLoading }: AddressInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    // Load Google Maps script
    const loadScript = () => {
      if (window.google?.maps?.places) {
        setIsScriptLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&libraries=places`;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onload = () => {
        setIsScriptLoaded(true);
      };
      script.onerror = () => {
        console.error("Failed to load Google Maps script");
      };
      document.head.appendChild(script);
    };

    loadScript();
  }, []);

  useEffect(() => {
    if (!isScriptLoaded || !inputRef.current || autocompleteRef.current) return;

    // Initialize autocomplete
    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "us" },
      types: ["address"],
      fields: ["formatted_address", "place_id", "geometry"],
    });

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current?.getPlace();
      if (place?.formatted_address && place?.place_id) {
        setInputValue(place.formatted_address);
        onAddressSelect(place.formatted_address, place.place_id);
      }
    });
  }, [isScriptLoaded, onAddressSelect]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAddressSelect(inputValue.trim(), "");
    }
  };

  // Truncate address for button display
  const getButtonText = () => {
    if (isLoading) {
      return "Analyzing...";
    }
    if (inputValue.trim()) {
      // Show truncated address in button
      const truncated = inputValue.length > 25 
        ? inputValue.substring(0, 25) + "..." 
        : inputValue;
      return truncated;
    }
    return "Get Estimate";
  };

  const hasAddress = inputValue.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Enter your home address..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="pl-12 h-14 text-lg bg-white border-2 border-border focus:border-primary rounded-xl shadow-sm"
            disabled={isLoading}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className={`h-14 px-6 text-base font-semibold rounded-xl shadow-lg transition-all duration-200 ${
            hasAddress 
              ? "bg-primary hover:bg-primary/90 min-w-[200px]" 
              : "bg-primary hover:bg-primary/90"
          }`}
          disabled={isLoading || !inputValue.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin flex-shrink-0" />
              <span className="truncate">Analyzing...</span>
            </>
          ) : hasAddress ? (
            <>
              <span className="truncate max-w-[150px]">{getButtonText()}</span>
              <ArrowRight className="ml-2 h-5 w-5 flex-shrink-0" />
            </>
          ) : (
            <>
              <Search className="mr-2 h-5 w-5 flex-shrink-0" />
              <span>Get Estimate</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
