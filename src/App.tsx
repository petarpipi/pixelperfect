import { lazy, Suspense } from "react";
import { Link, Route, Routes } from "react-router";
import { Shell } from "./components/Shell";
import { LoadingState } from "./components/UI";

const Dashboard = lazy(() =>
  import("./pages/Dashboard").then((module) => ({ default: module.Dashboard })),
);
const Transactions = lazy(() =>
  import("./pages/Transactions").then((module) => ({
    default: module.Transactions,
  })),
);
const Analytics = lazy(() =>
  import("./pages/Analytics").then((module) => ({ default: module.Analytics })),
);

export function App() {
  return (
    <Suspense fallback={<LoadingState />}>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="analytics" element={<Analytics />} />
          <Route
            path="*"
            element={
              <section className="empty-state">
                <h1>Page not found</h1>
                <Link className="button" to="/">
                  Back to Overview
                </Link>
              </section>
            }
          />
        </Route>
      </Routes>
    </Suspense>
  );
}
