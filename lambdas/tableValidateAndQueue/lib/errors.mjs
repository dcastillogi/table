export class MissingFieldError extends Error {
    constructor(message) {
        super(message);
        this.name = "MissingFieldsError";
        this.statusCode = 400;
    }
}

export class InvalidTableIdError extends Error {
    constructor(message) {
        super(message);
        this.name = "InvalidTableIdError";
        this.statusCode = 400;
    }
}

export class InvalidCredentialsError extends Error {
    constructor(message) {
        super(message);
        this.name = "InvalidCredentialsError";
        this.statusCode = 401;
    }
}

export class TableNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = "TableNotFoundError";
        this.statusCode = 404;
    }
}

export class DuplicateEntryError extends Error {
    constructor(message) {
        super(message);
        this.name = "DuplicateEntryError";
        this.statusCode = 409;
    }
}

export class TableAlreadyExistsError extends Error {
    constructor(message) {
        super(message);
        this.name = "TableAlreadyExistsError";
        this.statusCode = 409;
    }
}

export class KeyGenerationError extends Error {
    constructor(message) {
        super(message);
        this.name = "KeyGenerationError";
        this.statusCode = 500;
    }
}

export class DBError extends Error {
    constructor(message) {
        super(message);
        this.name = "DBError";
        this.statusCode = 500;
    }
}

