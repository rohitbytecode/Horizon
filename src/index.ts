import { loadConfig } from "./config/config.js";
import { ProxyServer } from "./core/ProxyServer.js";

const config = loadConfig();

const proxy = new ProxyServer(config);

proxy.start();