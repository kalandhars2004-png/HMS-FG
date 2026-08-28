import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { BranchProvider } from "@/lib/branch-context";
import { ThemeProvider } from "@/lib/theme-context";
import { GlobalLoaderProvider } from "@/components/ui/global-loader/GlobalLoaderProvider";

export const metadata: Metadata = {
  title: "Inventory Management",
  description: "Inventory Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider>
          <GlobalLoaderProvider>
            <AuthProvider>
              <BranchProvider>{children}</BranchProvider>
            </AuthProvider>
          </GlobalLoaderProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
