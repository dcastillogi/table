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
                    "Content-Type": "text/event-stream",
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
            if (buffer.startsWith("event: error")) {
                throw new Error(buffer.split("\n")[1].split("data: ")[1]);
            } else {
                const lines = buffer.split("\n\n");
                console.log(lines);
                for (let i = 0; i < lines.length - 1; i ++) {
                    const line = lines[i].trim();

                    if (line.startsWith("event: columns")) {
                        const columns = JSON.parse(
                            line.split("data: ")[1]
                        );
                        setTableData({
                            tableId: d.tableId,
                            columns,
                        });
                    } else if (line.startsWith("event: rows")) {
                        const totalRows = parseInt(
                            line.split("data: ")[1],
                            10
                        );
                        setTableData((prev) => {
                            if (prev) {
                                return {
                                    ...prev,
                                    totalRows,
                                };
                            }
                            return prev;
                        });
                    } else if (line.startsWith("event: row")) {
                        const rowData = JSON.parse(
                            line.split("data: ")[1]
                        );
                        setTableData((prev) => {
                            if (prev) {
                                return {
                                    ...prev,
                                    rows: prev.rows
                                        ? [...prev.rows, rowData]
                                        : [rowData],
                                };
                            }
                            return prev;
                        });
                    }
                }
            }
        }

        return {
            status: "success",
        };
    } catch (error: any) {
        console.log(error.message);
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
