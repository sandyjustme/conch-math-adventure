import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import VerifyPage from "./components/redeem/VerifyPage";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import "./index.css";

// 咖啡师扫码打开的核销页：独立于学生端 App，不触发持久化等副作用
const isVerify = window.location.hash.startsWith("#verify=");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>{isVerify ? <VerifyPage /> : <App />}</ErrorBoundary>
  </React.StrictMode>
);
