/**
 * Logging using WintonJS
 * https://github.com/winstonjs/winston
 */

import winston from "winston";
import VSCodeOutputTransport from "./logging/vsCodeOutputTransport";
import axios, { AxiosError } from "axios";
import { ClientRequest } from "http";

// TODO: migrate over all logging for client to winston logger

// Create logger from winston
export const logger = winston.createLogger({
    level: "info",
    defaultMeta: { category: "General" },
    format: winston.format.combine(
        winston.format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss",
        }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),

    // TODO: add file log
    transports: [new VSCodeOutputTransport({ level: "silly" })],
});

export const createChildLogger = (label: string) => {
    return logger.child({
        level: "info",
        defaultMeta: { category: label },
        format: winston.format.combine(
            winston.format.timestamp({
                format: "YYYY-MM-DD HH:mm:ss",
            }),
            winston.format.errors({ stack: true }),
            winston.format.json()
        ),
    });
};

const axiosLogger = createChildLogger("AXIOS");

axios.interceptors.request.use(
    (request) => {
        axiosLogger.http(
            `${request.method.toUpperCase()} requesting ${request.url}`
        );

        return request;
    },
    (error: AxiosError) => {
        const url = error.config.url;
        const method = error.config.method.toUpperCase();

        axiosLogger.error(`${url} ${method} ${error.code} ${error.message}`);
        return Promise.reject(error);
    }
);

axios.interceptors.response.use(
    (response) => {
        const request = response.request as ClientRequest;
        const url = `${request.protocol}//${request.host}${request.path}`;

        const message = `${request.method} ${response.status} ${response.statusText}: ${url} | Size: ${response.headers["content-length"]} Type: ${response.headers["content-type"]}`;

        axiosLogger.http(message);

        return response;
    },
    (error: AxiosError) => {
        const url = error.config.url;
        const method = error.config.method.toUpperCase();

        axiosLogger.error(`${url} ${method} ${error.code} ${error.message}`);

        return Promise.reject(error);
    }
);