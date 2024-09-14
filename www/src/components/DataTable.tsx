"use client";

import { Table } from "@/lib/types";
import {
    Badge,
    Box,
    Card,
    Flex,
    IconButton,
    Table as RadixTable,
    ScrollArea,
    Skeleton,
    TextField,
} from "@radix-ui/themes";
import React, { useState } from "react";
import { CheckIcon, CopyIcon } from "@radix-ui/react-icons";

export default function DataTable({ table, children }: { table: Table, children: React.ReactNode }) {
    const [copied, setCopied] = useState(false);
    const apiUrl = `https://api.table.dcastillogi.com/v1/append/${table.tableId}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(apiUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Flex
            direction="column"
            width="100%"
            height="calc(100vh - 100px)"
            overflow="hidden"
            px="6"
        >
            <Card
                size="4"
                style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {children}

                <Card size="1" mb="3">
                    <Flex align="center" gap="2">
                        <Badge
                            color="green"
                            style={{ height: "30px", padding: "0px 10px" }}
                        >
                            POST/GET
                        </Badge>
                        <TextField.Root
                            style={{ flexGrow: "1" }}
                            defaultValue={apiUrl}
                            readOnly
                        ></TextField.Root>
                        <IconButton variant="soft" onClick={copyToClipboard}>
                            {copied ? <CheckIcon /> : <CopyIcon />}
                        </IconButton>
                    </Flex>
                </Card>
                <ScrollArea style={{ flex: 1, width: "100%" }}>
                    <Box style={{ minWidth: "fit-content" }}>
                        <RadixTable.Root>
                            <RadixTable.Header>
                                <RadixTable.Row>
                                    {table.columns.map((column, index) => (
                                        <RadixTable.ColumnHeaderCell
                                            key={`header-column-${index}`}
                                        >
                                            {column}
                                        </RadixTable.ColumnHeaderCell>
                                    ))}
                                </RadixTable.Row>
                            </RadixTable.Header>
                            {table.rows && (
                                <RadixTable.Body>
                                    {[...Array(table.totalRows)].map(
                                        (_, row_index) => {
                                            let flag =
                                                Object.keys(
                                                    table.rows![row_index] ?? {}
                                                ).length === 0;
                                            return (
                                                <RadixTable.Row
                                                    key={`row-${row_index}`}
                                                >
                                                    {table.columns.map(
                                                        (column, col_index) => (
                                                            <RadixTable.Cell
                                                                key={`row-${row_index}-column-${col_index}`}
                                                                style={{
                                                                    whiteSpace:
                                                                        "nowrap",
                                                                    overflow:
                                                                        "hidden",
                                                                    textOverflow:
                                                                        "ellipsis",
                                                                }}
                                                            >
                                                                {table.rows![
                                                                    row_index
                                                                ]?.[column] ??
                                                                    (flag ? (
                                                                        <Skeleton height="100%" />
                                                                    ) : (
                                                                        "-"
                                                                    ))}
                                                            </RadixTable.Cell>
                                                        )
                                                    )}
                                                </RadixTable.Row>
                                            );
                                        }
                                    )}
                                </RadixTable.Body>
                            )}
                        </RadixTable.Root>
                    </Box>
                </ScrollArea>
            </Card>
        </Flex>
    );
}
