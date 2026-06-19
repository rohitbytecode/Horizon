import http from "http";
import type { HorizonConfig } from "../config/types.js";
import { LoadBalancer } from "./LoadBalancer.js";
import { Logger } from "../logger/Logger.js";
import { HealthChecker } from "../health/HealthChecker.js";

export class ProxyServer {
    private balancer: LoadBalancer;

    constructor(
        private config: HorizonConfig,
        private healthChecker: HealthChecker
    ) {
        this.balancer = new LoadBalancer(config.backends);
        this.healthChecker = new HealthChecker(
            config.backends
        )
    }

    start() {
    const server = http.createServer((clientReq, clientRes) => {
        let backend;

        try {
            backend = this.balancer.next();
        } catch {
            clientRes.statusCode = 503;
            clientRes.end("No healthy backends available");
            return;
        }

        Logger.info(
            `${clientReq.method} ${clientReq.url} -> ${backend.port}`
        );

        const proxyReq = http.request(
            {
                hostname: backend.host,
                port: backend.port,
                path: clientReq.url,
                method: clientReq.method,
                headers: clientReq.headers
            },
            (proxyRes) => {
                clientRes.writeHead(
                    proxyRes.statusCode || 500,
                    proxyRes.headers
                );
                proxyRes.pipe(clientRes);
            }
        );

        clientReq.pipe(proxyReq);

        proxyReq.on("error", err => {
            Logger.error(err.message);
            clientRes.statusCode = 502;
            clientRes.end("Bad gateway");
        });
    });

    this.healthChecker.start();

    server.listen(this.config.port, () => {
        Logger.info(`Horizon listening on ${this.config.port}`);
    });
    }

}