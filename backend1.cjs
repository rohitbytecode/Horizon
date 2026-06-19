const http = require("http");

http.createServer((req, res) => {

    if (req.url === "/health") {
        res.statusCode = 200;
        return res.end("OK");
    }

    res.end("Backend 5000");
    
}).listen(5000);