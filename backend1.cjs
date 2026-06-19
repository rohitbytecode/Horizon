const http = require("http");

http.createServer((req, res) => {
    res.end("Backend 5000");
}).listen(5000);