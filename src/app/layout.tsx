import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workout Tracker",
  description: "Track your workouts and progressive overload",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <div className="max-w-lg mx-auto px-4 pb-8">{children}</div>
      </body>
    </html>
  );
}
