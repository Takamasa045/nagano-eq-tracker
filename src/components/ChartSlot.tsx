import { Component, Suspense, type ReactNode } from "react";

interface BoundaryProps {
  children: ReactNode;
}

interface BoundaryState {
  failed: boolean;
}

/**
 * 遅延読み込みチャートのエラー境界。
 * 毎時デプロイで古いチャンクが 404 になっても、該当パネルだけ
 * 静かに退避し、アプリ全体のクラッシュ（白画面）を防ぐ。
 */
class ChartErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="chart-error" role="status">
          グラフを表示できませんでした。
          <button onClick={() => location.reload()}>再読み込み</button>
        </div>
      );
    }
    return this.props.children;
  }
}

/** エラー境界 + Suspense をまとめたチャート用スロット */
export function ChartSlot({ children }: { children: ReactNode }) {
  return (
    <ChartErrorBoundary>
      <Suspense fallback={<div className="chart-fallback" aria-hidden />}>
        {children}
      </Suspense>
    </ChartErrorBoundary>
  );
}
