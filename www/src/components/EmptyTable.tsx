"use client";

import { Table } from "@/lib/types";
import {
    Badge,
    Box,
    Card,
    Flex,
    IconButton,
    Link,
    Text,
    TextField,
} from "@radix-ui/themes";
import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { CheckIcon, CopyIcon } from "@radix-ui/react-icons";

export default function EmptyTable({ table, children }: { table: Table, children: React.ReactNode }) {
    const [copied, setCopied] = useState(false);
    const apiUrl = `https://api.table.dcastillogi.com/v1/append/${table.tableId}`;

    useEffect(() => {
        var count = 200;
        var defaults = {
            origin: { y: 0.5 },
        };

        function fire(
            particleRatio: number,
            opts: confetti.Options | undefined
        ) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio),
            });
        }

        fire(0.25, {
            spread: 26,
            startVelocity: 55,
        });
        fire(0.2, {
            spread: 60,
        });
        fire(0.35, {
            spread: 100,
            decay: 0.91,
            scalar: 0.8,
        });
        fire(0.1, {
            spread: 120,
            startVelocity: 25,
            decay: 0.92,
            scalar: 1.2,
        });
        fire(0.1, {
            spread: 120,
            startVelocity: 45,
        });
    }, []);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(apiUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Box maxWidth="100%" px="4">
            <Box maxWidth="576px">
                <Card size="4">
                    {children}
                    <Text size="3" weight="regular" wrap="pretty">
                        Your table is ready to receive data! Let{"'"}s get
                        started by adding your first row.
                    </Text>

                    <Card size="1" my="3">
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
                            <IconButton
                                variant="soft"
                                onClick={copyToClipboard}
                            >
                                {copied ? <CheckIcon /> : <CopyIcon />}
                            </IconButton>
                        </Flex>
                    </Card>

                    <Text size="3" weight="regular" wrap="pretty">
                        Need help or have questions? Check out our{" "}
                        <Link
                            target="_blank"
                            href="https://github.com/dcastillogi/table"
                        >
                            Github Repository
                        </Link>
                        .
                    </Text>
                </Card>
            </Box>
        </Box>
    );
}
