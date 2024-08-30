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

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            lines.forEach((line) => {
                if (line.startsWith("columns:")) {
                    setTableData((prevData: any) => ({
                        ...prevData,
                        columns: JSON.parse(line.substring(8)),
                    }));
                } else if (line.startsWith("rows:")) {
                    setTableData((prevData: any) => ({
                        ...prevData,
                        totalRows: parseInt(line.substring(5)),
                    }));
                } else if (line.startsWith("row")) {
                    const rowData = JSON.parse(
                        line.substring(line.indexOf(":") + 1)
                    );
                    setTableData((prevData: any) => ({
                        ...prevData,
                        rows: [...prevData.rows, rowData],
                    }));
                } else {
                    throw new Error(line);
                }
            });
        }

        return {
            status: "success",
        }
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
            errorMessage
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
