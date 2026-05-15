type Props = {
  onAddClick: () => void;
};

export function Header({ onAddClick }: Props) {
  return (
    <header className="flex items-center justify-between bg-slate-900 px-8 py-4 text-white shadow">
      <h1 className="text-xl font-semibold">タスク管理ボード</h1>
      <button
        type="button"
        onClick={onAddClick}
        className="rounded bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
      >
        ＋タスク追加
      </button>
    </header>
  );
}
