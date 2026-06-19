export interface Backend {
    id: string;
    host: string;
    port: number;
    healthy: boolean;
}

export interface HorizonConfig {
    port: number;
    backends: Backend[];
}