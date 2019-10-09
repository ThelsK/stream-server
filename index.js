const http = require("http")
const webSocket = require("websocket")

const port = process.env.PORT || 6789
const connections = []
let nextID = 1

// Handle regular web requests with a 404 response.
const handleWebRequest = (req, res) => {
  res.writeHead(404).end()
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

// Handle websockets.
webSocketServer.on("request", req => {

  // Accept the request, and add it to the connections.
  const connection = req.accept("json", req.origin)
  console.log("Connection accepted from:", connection.remoteAddress)
  connections.push(connection)

  // Set a client ID and return this ID to the client.
  connection.clientID = nextID++
  connection.sendUTF(JSON.stringify({
    type: "id",
    id: connection.clientID
  }))

  connection.on("message", msg => {
    if (msg.type === "utf8") {
      console.log("Received message:", msg.utf8Data)
    }
  })
})