import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-ocean-shimmer">
          <div className="text-5xl mb-4">🐚</div>
          <h2 className="font-display text-2xl text-stone-600 mb-2">
            哎呀，海小喵打了个喷嚏
          </h2>
          <p className="text-sm text-stone-500 mb-6">
            出了一点小问题，刷新一下就好了
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="px-6 py-3 rounded-full bg-teal-500 text-white font-bold text-sm hover:bg-teal-600 transition"
            aria-label="刷新页面，重新开始"
          >
            重新开始 →
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
