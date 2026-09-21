import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { TipProvider } from "./components/Tip";
import { Shell } from "./components/Shell";
import { SessionProvider } from "./session";
import { DeskPage } from "./pages/DeskPage";
import { StatsPage } from "./pages/StatsPage";
import { IntegratePage } from "./pages/IntegratePage";
import { GapPage } from "./pages/GapPage";
import { DocsPage } from "./pages/DocsPage";
import { DemoPage } from "./pages/DemoPage";

export function App() {
  return (
    <BrowserRouter>
      <TipProvider>
        <SessionProvider>
          <div className="void-wash" aria-hidden />
          <Routes>
            <Route element={<Shell />}>
              <Route index element={<Navigate to="/desk" replace />} />
              <Route path="/desk" element={<DeskPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/integrate" element={<IntegratePage />} />
              <Route path="/gap" element={<GapPage />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/demo" element={<DemoPage />} />
              <Route path="*" element={<Navigate to="/desk" replace />} />
            </Route>
          </Routes>
        </SessionProvider>
      </TipProvider>
    </BrowserRouter>
  );
}
