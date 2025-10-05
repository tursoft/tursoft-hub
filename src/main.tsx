import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Initialize data helper then render the app to avoid data-race issues
(async function initAndRender() {
	createRoot(document.getElementById("root")!).render(<App />);
})();
