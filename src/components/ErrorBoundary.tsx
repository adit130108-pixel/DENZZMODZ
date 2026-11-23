import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Terjadi kesalahan tak terduga.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0A0612] px-4 text-violet-50">
          <div className="max-w-md rounded-2xl border border-rose-500/40 bg-[#130D21] p-6 space-y-4">
            <h1 className="font-display text-xl font-bold text-white">
              Terjadi Gangguan pada Aplikasi
            </h1>
            <p className="text-sm text-[#C4BBD9]">
              Silakan muat ulang halaman atau periksa kembali koneksi serta izin akses Firebase Anda.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
