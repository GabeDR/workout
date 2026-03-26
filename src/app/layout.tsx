import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workout Tracker",
  description: "Track your workouts and progressive overload",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <div className="grid grid-cols-[1fr_min(640px,100%)_1fr] [&>*]:col-start-2 [&>*]:col-end-3 [&>*]:px-4 sm:[&>*]:px-6 lg:[&>*]:px-8">
          {children}
        </div>
      </body>
    </html>
  );
}
