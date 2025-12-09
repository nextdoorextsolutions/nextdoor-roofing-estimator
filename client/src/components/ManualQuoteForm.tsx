import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, Loader2, AlertTriangle, Home } from "lucide-react";

interface ManualQuoteFormProps {
  address: string;
  satelliteImageUrl: string;
  onSubmit: (data: { name?: string; email?: string; phone?: string }) => void;
  isLoading?: boolean;
}

export function ManualQuoteForm({ address, satelliteImageUrl, onSubmit, isLoading }: ManualQuoteFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() && !email.trim() && !phone.trim()) {
      setError("Please provide at least one contact method");
      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    onSubmit({
      name: name.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Warning Card */}
      <Card className="border-amber-300 bg-amber-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-amber-800">Satellite Data Unavailable</CardTitle>
              <CardDescription className="text-amber-700">
                We couldn't retrieve roof measurements for this property
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-800">
            This can happen for newer homes, rural properties, or areas with limited satellite coverage. 
            Don't worry! Request a manual quote and our team will contact you within 24 hours.
          </p>
        </CardContent>
      </Card>

      {/* Property Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <img
              src={satelliteImageUrl}
              alt="Satellite view"
              className="w-32 h-24 object-cover rounded-lg"
            />
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Home className="h-4 w-4" />
                <span className="text-sm">Property Address</span>
              </div>
              <p className="font-medium">{address}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Form */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Request Manual Quote</CardTitle>
          <CardDescription>
            Our team will measure your roof and provide a detailed estimate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Provide at least one contact method
            </p>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Request Manual Quote"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
