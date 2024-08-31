import { LoginValues, Table } from "./types";

export const loginHandler = async (
    d: LoginValues,
    setTableData: React.Dispatch<React.SetStateAction<Table | null>>
) => {
    try {
        const response = await fetch(
            "https://api.table.dcastillogi.com/v1/retrieveStream",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(d),
                cache: "no-store",
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");

            for (let i = 0; i < lines.length - 1; i++) {
                const line = lines[i].trim();

                if (line.startsWith("event: columns")) {
                    const columns = JSON.parse(line.split("data: ")[1]);
                    setTableData((prevData: any) => ({
                        ...prevData,
                        columns,
                    }));
                } else if (line.startsWith("event: rows")) {
                    const totalRows = parseInt(line.split("data: ")[1], 10);
                    setTableData((prevData: any) => ({
                        ...prevData,
                        totalRows,
                    }));
                } else if (line.startsWith("event: row")) {
                    const rowData = JSON.parse(line.split("data: ")[1]);
                    setTableData((prevData: any) => ({
                        ...prevData,
                        rows: [...(prevData?.rows || []), rowData],
                    }));
                } else if (line.startsWith("event: error")) {
                    const errorMsg = line.split("data: ")[1];
                    throw new Error(errorMsg);
                }
            }

            // Keep the last line in the buffer in case it's a partial line
            buffer = lines[lines.length - 1];
        }

        return {
            status: "success",
        };
    } catch (error: any) {
        let errorName = "ServerError";
        let errorMessage = "There was an error retrieving the table";
        if (error.message.includes(": ")) {
            const [name, message] = error.message.split(": ");
            errorName = name;
            errorMessage = message;
        }
        return {
            status: "error",
            errorName,
            errorMessage,
        };
    }
};

export const createHandler = async (data: LoginValues) => {
    try {
        const response = await fetch(
            "https://api.table.dcastillogi.com/v1/create",
            {
                method: "POST",
                body: JSON.stringify(data),
                cache: "no-store",
            }
        );

        return await response.json();
    } catch (error) {
        console.error(error);
        return {
            status: "error",
            errorName: "ServerError",
            errorMessage: "There was an error creating the table",
        };
    }
};
