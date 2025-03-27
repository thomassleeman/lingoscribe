import { Inter, Playfair_Display } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Nav from "@/components/nav/Nav";
import Providers from "@/state/providers";
import type { Metadata } from "next";

import "./globals.css";

// Inter as your sans-serif font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Playfair Display as your serif font
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lingoscribe ai",
  description:
    "Learn languages by uploading your favourite content and chatting about it with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-screen`}
      suppressHydrationWarning
    >
      <Providers>
        <body className="antialiased h-full overflow-hidden flex flex-col bg-white dark:bg-black bg-background text-foreground font-sans">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Nav />
            {/* {children} */}
            <main className="flex-grow overflow-y-auto">{children}</main>
          </ThemeProvider>
        </body>
      </Providers>
    </html>
  );
}
