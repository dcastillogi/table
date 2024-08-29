import type { Metadata } from "next";
import "./globals.css";

import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
    title: "Table - Populate Your Table with Webhooks Effortlessly",
    description:
        "Webhook Table is a reliable, serverless solution designed for effortless data storage via webhooks. This system enables seamless data population in tables through simple webhook calls, paired with a user-friendly interface for data visualization.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                >
                    <Theme>{children}</Theme>
                </ThemeProvider>
            </body>
        </html>
    );
}
