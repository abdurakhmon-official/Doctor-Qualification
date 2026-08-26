import { AdminSubNav } from '@/components/admin/AdminSubNav';

export default function AdminLayout({ children }: LayoutProps<'/[locale]/admin'>) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-12">
      <AdminSubNav />
      {children}
    </main>
  );
}
