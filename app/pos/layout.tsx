export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50 dark:bg-[#0a0a0f]">
      {children}
    </div>
  );
}