const server = require("./server")
const { register } = require("./users")

const connections = []
const nextId = 1

// Handle websockets.
server.on("request", req => {

  // Accept the request, and add it to the connections.
  const connection = {}
  connections.push(connection)
  connection.id = nextId++

  connection.webSocket = req.accept("json", req.origin)
  console.log("Connection accepted from:",
    connection.webSocket.remoteAddress)

  connection.webSocket.on("message", async msg => {
    if (msg.type !== "utf8") {
      console.error("Incorrect data:", msg)
      return
    }

    const data = JSON.parse(msg.utf8Data)
    switch (data.type) {

      case "register":
        if (connection.username) {
          connection.webSocket.sendUTF(JSON.stringify({
            type: "message",
            message: `Already logged in as "${connection.username}".`
          }))
          return
        }

        const registerResult = await register(data)
        if (registerResult.username) {
          connection.username = registerResult.username
        }
        connection.webSocket.sendUTF(JSON.stringify(registerResult))
        return

      case "login":
        if (connection.username) {
          connection.webSocket.sendUTF(JSON.stringify({
            type: "message",
            message: `Already logged in as "${connection.username}".`
          }))
          return
        }

        const loginResult = await login(data)
        if (loginResult.username) {
          connection.username = loginResult.username
        }
        connection.webSocket.sendUTF(JSON.stringify(loginResult))
        return

      case "device":
        if (!connection.username) {
          connection.webSocket.sendUTF(JSON.stringify({
            type: "message",
            message: "Please login or register."
          }))
          return
        }

        if (connection.device) {
          connection.webSocket.sendUTF(JSON.stringify({
            type: "message",
            message: `Device already declared as "${connection.device}".`
          }))
          return
        }

        if (!data.device.trim()) {
          connection.webSocket.sendUTF(JSON.stringify({
            type: "message",
            message: "Please include a name for your device.",
          }))
          return
        }

        for (let i = 0; i < connections.length; i++) {
          if (connection.username === connections[i].username &&
            data.device.trim().toLowerCase() ===
            connections[i].device.toLowerCase()) {
            connection.webSocket.sendUTF(JSON.stringify({
              type: "message",
              message: "Devicename already in use for your account.",
            }))
          }
        }

        connection.device = data.device.trim()
        connection.webSocket.sendUTF(JSON.stringify({
          type: "device",
          device: data.device.trim(),
          message: "Devicename declared.",
        }))
        return

      default:
        console.error("Unknown data:", data)
    }
  })
})