import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Subjects from "./pages/Subjects";
import Topics from "./pages/Topics";
import Practice from "./pages/Practice";
import Results from "./pages/Results";
import Bookmarks from "./pages/Bookmarks";
import WrongAnswers from "./pages/WrongAnswers";
import Battle from "./pages/Battle";
import StudyRoom from "./pages/StudyRoom";
import Dashboard from "./pages/Dashboard";
import Revision from "./pages/Revision";
import RevisionPractice from "./pages/RevisionPractice";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "@/components/ThemeProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/subjects" element={<Subjects />} />
              <Route path="/subjects/:subjectId" element={<Topics />} />
              <Route path="/practice/:subjectId/:topicId" element={<Practice />} />
              <Route path="/results" element={<Results />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
              <Route path="/wrong" element={<WrongAnswers />} />
              <Route path="/battle" element={<Battle />} />
              <Route path="/study" element={<StudyRoom />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/revision" element={<Revision />} />
              <Route path="/revision/practice" element={<RevisionPractice />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
