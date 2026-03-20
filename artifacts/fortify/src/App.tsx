import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute, OnboardingRoute } from "@/components/ProtectedRoute";

import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import OnboardingPage from "@/pages/OnboardingPage";
import FeedPage from "@/pages/FeedPage";
import WorkoutDetailPage from "@/pages/WorkoutDetailPage";
import MovementsPage from "@/pages/MovementsPage";
import MovementDetailPage from "@/pages/MovementDetailPage";
import PRsPage from "@/pages/PRsPage";
import CommunityPage from "@/pages/CommunityPage";
import ProfilePage from "@/pages/ProfilePage";
import SubtrackPreviewPage from "@/pages/SubtrackPreviewPage";
import ProgramPage from "@/pages/ProgramPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/onboarding">
        {() => (
          <OnboardingRoute>
            <OnboardingPage />
          </OnboardingRoute>
        )}
      </Route>
      
      {/* Protected App Routes */}
      <Route path="/feed">
        {() => (
          <ProtectedRoute>
            <FeedPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/program">
        {() => (
          <ProtectedRoute>
            <ProgramPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/workout/:id">
        {() => (
          <ProtectedRoute>
            <WorkoutDetailPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/movements">
        {() => (
          <ProtectedRoute>
            <MovementsPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/movements/:id">
        {() => (
          <ProtectedRoute>
            <MovementDetailPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/prs">
        {() => (
          <ProtectedRoute>
            <PRsPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/chat">
        {() => (
          <ProtectedRoute>
            <CommunityPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/profile">
        {() => (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/subtrack/:id">
        {() => (
          <ProtectedRoute>
            <SubtrackPreviewPage />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster theme="dark" />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
