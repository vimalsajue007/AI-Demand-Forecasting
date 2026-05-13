import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto scrollbar-thin">
        <div className="p-6 max-w-7xl mx-auto animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
