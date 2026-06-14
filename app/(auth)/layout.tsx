export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="office-bg flex min-h-screen items-center justify-center px-4 py-8 lg:justify-end lg:px-6 lg:pt-20 xl:px-8">{children}</main>;
}
