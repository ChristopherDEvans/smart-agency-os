import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      </Route>
      <Route path="/clients">
        <DashboardLayout>
          <Clients />
        </DashboardLayout>
      </Route>
      <Route path="/engagements">
        <DashboardLayout>
          <div className="text-center py-12 text-muted-foreground">Engagements page coming soon</div>
        </DashboardLayout>
      </Route>
      <Route path="/proposals">
        <DashboardLayout>
          <div className="text-center py-12 text-muted-foreground">Proposals page coming soon</div>
        </DashboardLayout>
      </Route>
      <Route path="/reports">
        <DashboardLayout>
          <div className="text-center py-12 text-muted-foreground">Reports page coming soon</div>
        </DashboardLayout>
      </Route>
      <Route path="/inbox">
        <DashboardLayout>
          <div className="text-center py-12 text-muted-foreground">Inbox page coming soon</div>
        </DashboardLayout>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
