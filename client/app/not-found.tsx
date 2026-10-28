import Link from "next/link";

export default function NotFound() {
  return (
    <div className="animate-fade-up mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <p className="text-6xl">🪙</p>
      <h1 className="mt-6 text-2xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-2 text-slate-500">This page has gone the way of the Ceylon cent.</p>
      <Link href="/" className="btn btn-primary mt-8">Back to the marketplace</Link>
    </div>
  );
}
