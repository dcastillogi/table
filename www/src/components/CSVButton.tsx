"use client";

import { Table } from "@/lib/types";
import { DownloadIcon } from "@radix-ui/react-icons";
import { Button } from "@radix-ui/themes";
import { useState } from "react";

export default function CSVButton({
    tableData
}: {
    tableData: Table
}) {
    const [loading, setLoading] = useState(false);

    
    const download = async () => {
        setLoading(true);
        let csv = tableData.columns.join(",") + "\n";
        tableData.rows?.forEach((row) => {
            csv += Object.values(row).join(",") + "\n";
        });
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "data.csv";
        a.click();
        setLoading(false);
    }

    return (
            <Button
                type="button"
                size="1"
                loading={loading}
                onClick={download}
            >
                CSV <DownloadIcon width={11} height={11} />
            </Button>
    );
}
