import React from "react";
import { createRoot } from "react-dom/client";
import UnravelApp from "./App";
import "./unravel.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <UnravelApp />
  </React.StrictMode>
);
