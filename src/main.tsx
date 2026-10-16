import React from "react";
import { createRoot } from "react-dom/client";
import "@perspective-living/react-ui/styles.css";
import "./quote.css";
import App from "./App";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
