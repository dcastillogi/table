import { Flex, Text, Heading } from "@radix-ui/themes";
import RefreshButton from "./RefreshButton";
import { ModeToggle } from "./ModeToggle";
import { LoginValues } from "@/lib/types";

export default function TableHeading({
    tableId,
    handleDataRetrieval,
    data,
    children
}: {
    tableId: string;
    handleDataRetrieval: (data: LoginValues) => Promise<{
        status: string;
        errorName?: string;
        errorMessage?: string;
    }>;
    data: LoginValues;
    children?: React.ReactNode;
}) {
    return (
        <Flex justify="between" align="center" mb="5">
            <Flex align="center" gap="2">
                <Heading as="h3" size="6" mb="-2" trim="start">
                    Table{" "}
                    <Text weight="regular" size="4">
                        ID: {tableId}
                    </Text>
                </Heading>
                {children}
                <RefreshButton handleDataRetrieval={handleDataRetrieval} data={data} />
            </Flex>
            <ModeToggle />
        </Flex>
    );
}
