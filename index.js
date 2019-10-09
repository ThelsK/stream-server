const { User, Device } = require("./models")
const server = require("./server")

const connections = []
let nextID = 1

// Handle websockets.
server.on("request", req => {

  // Accept the request, and add it to the connections.
  const webSocket = req.accept("json", req.origin)
  console.log("Connection accepted from:", webSocket.remoteAddress)
  connections.push(webSocket)

  // Set a client ID and return this ID to the client.
  webSocket.clientID = nextID++
  webSocket.sendUTF(JSON.stringify({
    type: "id",
    id: webSocket.clientID
  }))

  webSocket.on("message", msg => {
    if (msg.type !== "utf8") {
      console.error("Incorrect data:", msg)
      return
    }

    const data = msg.utf8Data
    console.log("Received data:", data)
  })
})