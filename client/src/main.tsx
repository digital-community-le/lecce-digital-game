import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize theme on app start
const savedTheme = localStorage.getItem('ldc:theme') || 'default';
document.documentElement.className = `ldc-theme--${savedTheme}`;

createRoot(document.getElementById("root")!).render(<App />);
