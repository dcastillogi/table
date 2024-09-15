"use client";

import { Table } from "@/lib/types";
import { DownloadIcon } from "@radix-ui/react-icons";
import { Button } from "@radix-ui/themes";
import { useState } from "react";

export default function CSVButton({ tableData }: { tableData: Table }) {
    const [loading, setLoading] = useState(false);

    const escapeCSVValue = (value: string) => {
        if (typeof value === "string") {
            // Escape double quotes by replacing each one with two double quotes
            value = value.replace(/"/g, '""');

            // Wrap the value in double quotes if it contains a comma, a newline, or double quotes
            if (
                value.includes(",") ||
                value.includes("\n") ||
                value.includes('"')
            ) {
                return `"${value}"`;
            }
        }
        return value;
    };

    const download = async () => {
        try {
            setLoading(true);
            if (!tableData?.columns || !tableData?.rows) {
                console.error("No data available for download");
                return;
            }

            // Join column headers
            let csv = tableData.columns.map(escapeCSVValue).join(",") + "\n";

            // Process rows and escape values
            tableData.rows.forEach((row) => {
                const escapedRow = Object.values(row)
                    .map(escapeCSVValue)
                    .join(",");
                csv += escapedRow + "\n";
            });

            // Create and download the CSV file
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "data.csv";
            a.click();
            URL.revokeObjectURL(url); // Clean up memory
        } catch (error) {
            console.error("Error downloading CSV:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button type="button" size="1" loading={loading} onClick={download}>
            CSV <DownloadIcon width={11} height={11} />
        </Button>
    );
}
