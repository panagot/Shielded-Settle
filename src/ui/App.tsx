import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { TipProvider } from "./components/Tip";
import { Shell } from "./components/Shell";
import { SessionProvider } from "./session";
import { DeskPage } from "./pages/DeskPage";
import { StatsPage } from "./pages/StatsPage";
import { IntegratePage } from "./pages/IntegratePage";
import { GapPage } from "./pages/GapPage";
import { DocsPage } from "./pages/DocsPage";
import { DemoPage } from "./pages/DemoPage";
import { HomePage } from "./pages/HomePage";

const LivePage = lazy(() =>
  import("./pages/LivePage").then((m) => ({ default: m.LivePage })),
);

export function App() {
  return (
    <BrowserRouter>
      <TipProvider>
        <SessionProvider>
          <div className="void-wash" aria-hidden />
          <Routes>
            <Route element={<Shell />}>
              <Route index element={<HomePage />} />
              <Route path="/desk" element={<DeskPage />} />
              <Route
                path="/live"
                element={
                  <Suspense fallback={<p className="lede">Loading Preprod live desk…</p>}>
                    <LivePage />
                  </Suspense>
                }
              />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/integrate" element={<IntegratePage />} />
              <Route path="/gap" element={<GapPage />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/demo" element={<DemoPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </SessionProvider>
      </TipProvider>
    </BrowserRouter>
  );
}
