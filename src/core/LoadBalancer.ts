import type { Backend } from "../config/types.js";

export class LoadBalancer {
    private current = 0;
    constructor (private backends: Backend[]) {}

    next(): Backend {
        const backend = this.backends[this.current];

        this.current = 
        (this.current + 1) %
        this.backends.length;

        return backend;
    }    
}
// Round-robin:
// 5000
// 5001
// 5000
// 5001
// ...