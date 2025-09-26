import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import dataHelper from '@/lib/datahelper';

// Initialize data helper then render the app to avoid data-race issues
(async function initAndRender() {
	try {
		await dataHelper.init();
	} catch (err) {
		// Initialization failed, but we continue to render the app — the helper
		// methods gracefully handle missing data.
		console.error('DataHelper.init failed', err);
	}

	createRoot(document.getElementById("root")!).render(<App />);
})();
