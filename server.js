const http = require("http")
const webSocket = require("websocket")

const port = process.env.PORT || 6789

// Handle regular web requests with a 404 response.
const handleWebRequest = (req, res) => {
  res.writeHead(404)
  res.end()
}

// Create webserver.
let webServer = null
try {
  webServer = http.createServer({}, handleWebRequest)
} catch (error) {
  console.error(error)
}

// Wrap server in websocket.
const webSocketServer = new webSocket.server({
  httpServer: webServer,
  autoAcceptConnections: false,
})

// Start listening.
if (webSocketServer) {
  webServer.listen(port, () => console.log(`Listening on :${port}`))
}

module.exports = webSocketServer