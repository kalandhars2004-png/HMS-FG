import type { Metadata } from "next";
import "./globals.css";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { BranchProvider } from "@/lib/branch-context";
import { ThemeProvider } from "@/lib/theme-context";
import { GlobalLoaderProvider } from "@/components/ui/global-loader/GlobalLoaderProvider";

// Professional pharmacy type system — Inter for precise UI data, Outfit for confident headings, JetBrains Mono for tabular numbers
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});
const jetMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-mono",
  display: "swap",
});

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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable} ${jetMono.variable}`}>
      <body className="font-sans antialiased">
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
