"use client";

import { Box, Flex, Link, Text } from "@radix-ui/themes";
import LoginForm from "@/components/LoginForm";
import { useEffect, useState } from "react";
import { LoginValues, Table } from "@/lib/types";
import EmptyTable from "@/components/EmptyTable";
import DataTable from "@/components/DataTable";
import { loginHandler } from "@/lib/loginHandler";

export default function Home() {
    const [tableData, setTableData] = useState<Table | null>(null);

    const handleDataRetrieval = async(d: LoginValues) => {
        const response = await loginHandler(d, setTableData)
        return response
    }

    useEffect(() => {
        if (tableData) {
            console.log(tableData);
        }
    }, [tableData]);

    return (
        <Box style={{ whiteSpace: "nowrap" }} minHeight="100svh" className="bg">
            <Flex direction="column" style={{ minHeight: "100svh" }}>
                <Flex
                    justify="center"
                    align="center"
                    direction="column"
                    minHeight="100svh"
                    position="relative"
                >
                    {tableData ? (
                        tableData.columns.length > 0 ? (
                            <DataTable table={tableData} />
                        ) : (
                            <EmptyTable table={tableData} />
                        )
                    ) : (
                        <LoginForm setTable={setTableData} handleDataRetrieval={handleDataRetrieval} />
                    )}

                    <Text
                        size="2"
                        mt="3"
                        style={{ opacity: 0.8 }}
                        weight="regular"
                        as="span"
                    >
                        Made with ❤️ by{" "}
                        <Link
                            target="_blank"
                            href="https://github.com/dcastillogi"
                        >
                            @dcastillogi
                        </Link>
                    </Text>
                </Flex>
            </Flex>
        </Box>
    );
}
