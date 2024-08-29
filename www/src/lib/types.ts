export type AppError = {
    name: string;
    message: string;
};

export type Rows = {
    [key: string]: string;
};

export type Table = {
    tableId: string;
    columns: string[];
    rows: Rows[];
    totalRows: number;
}

export type LoginValues = {
    tableId: string;
    password: string;
    hCaptchaToken: string;
};