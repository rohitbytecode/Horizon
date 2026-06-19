import type { Backend } from "../config/types.js";

export class LoadBalancer {
    private current = 0;
    constructor (private backends: Backend[]) {}

    next(): Backend {
        const healthy = this.backends.filter(
            b => b.healthy
        );

        if(healthy.length === 0) {
            throw new Error (
                "No healthy backend available"
            )
        }
        const backend = healthy[
            this.current %
            healthy.length
        ];

        this.current++;

        return backend;
    }    
}
// Round-robin:
// 5000
// 5001
// 5000
// 5001
// ...