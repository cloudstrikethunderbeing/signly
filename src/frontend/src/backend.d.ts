import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface BugReport {
    description: string;
    email?: string;
    timestamp: bigint;
    deviceInfo: string;
}
export interface backendInterface {
    getAverageRating(): Promise<number>;
    getBugReports(): Promise<Array<BugReport>>;
    getRatingCount(): Promise<bigint>;
    health(): Promise<string>;
    submitBugReport(description: string, email: string | null, deviceInfo: string): Promise<void>;
    submitRating(value: bigint): Promise<void>;
}
