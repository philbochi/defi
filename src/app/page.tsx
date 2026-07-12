import Dashboard from "@/components/Dashboard";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader active="dashboard" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <Dashboard />
      </main>
      <SiteFooter />
    </div>
  );
}
