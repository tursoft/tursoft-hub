import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { isHydrating, loadPrerenderState } from "@/lib/prerender";

const container = document.getElementById("root")!;

const render = () => createRoot(container).render(<App />);

if (isHydrating) {
  // The page was prerendered at build time: attach to the existing markup instead of
  // rebuilding it. The prerendered content stays visible while the state loads. A section
  // whose markup cannot be matched is re-rendered on its own (each section has its own
  // Suspense boundary); that is reported as a warning, not an error.
  loadPrerenderState().then((ready) => {
    if (!ready) return render();
    hydrateRoot(container, <App />, {
      onRecoverableError: (error) => console.warn("[hydration]", error),
    });
  });
} else {
  render();
}
