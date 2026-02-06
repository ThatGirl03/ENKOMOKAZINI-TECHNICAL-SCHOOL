import { createRoot } from "react-dom/client";
import App from "../App.tsx";
import "../index.css";
import { loadSiteData, saveSiteData } from "@/lib/siteData";

async function bootstrap() {
	// try to fetch server data and sync to localStorage so viewers get latest
	try {
		const res = await fetch('/api/data');
		if (res.ok) {
			const json = await res.json();
			if (json && Object.keys(json).length) {
				saveSiteData(json);
				// ensure in-memory value used by components updates
				window.dispatchEvent(new CustomEvent('siteDataUpdated', { detail: json }));
			}
		}
	} catch (e) {
		// server not available — continue with local data
	}

	createRoot(document.getElementById("root")!).render(<App />);
}

bootstrap();
