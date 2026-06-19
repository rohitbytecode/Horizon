export interface Backend {
    host: string;
    port: number;
}

export interface HorizonConfig {
    port: number;
    backends: Backend[];
}