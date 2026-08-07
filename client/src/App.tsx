import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { AdminMoved } from "./pages/AdminMoved";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      {/* MARKED FOR REMOVAL — see DECOMMISSION.md.
          AdminDashboard.tsx calls trpc.admin.* on the standalone Render backend,
          which reads the old MySQL database. Now that /api/trpc proxies to the
          CRM those procedures do not exist, so the page could only ever 404.
          The CRM is the admin surface. */}
      <Route path={"/admin"} component={AdminMoved} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
