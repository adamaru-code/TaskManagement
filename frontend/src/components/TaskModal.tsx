import type { ReactNode } from 'react';

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function TaskModal({ title, onClose, children }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-md bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button
            type="button"
            aria-label="閉じる"
            className="text-slate-500 hover:text-slate-800"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
