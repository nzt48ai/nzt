import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import PositionCalculator from "./pages/PositionCalculator";
import CompoundCalculator from "./pages/CompoundCalculator";
import TradeJournal from "./pages/TradeJournal";
import ProgressDashboard from "./pages/ProgressDashboard";
import ShareCard from "./pages/ShareCard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<PositionCalculator />} />
            <Route path="/compound" element={<CompoundCalculator />} />
            <Route path="/journal" element={<TradeJournal />} />
            <Route path="/dashboard" element={<ProgressDashboard />} />
            <Route path="/share" element={<ShareCard />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
