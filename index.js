const server = require("./server")
const { register, login } = require("./users")

const connections = []
let nextId = 1

// Handle websockets.
server.on("request", req => {

  // Accept the request, and add it to the connections.
  const connection = {}
  connections.push(connection)
  connection.id = nextId++

  connection.webSocket = req.accept("json", req.origin)
  console.log("Connection accepted from:",
    connection.webSocket.remoteAddress)

  const updateStreams = username => {

    // Gather all active connections for this user.
    const userConnections = connections.filter(connection =>
      connection.username === username && connection.displayname)

    // Gather all streaming connections for this user.
    const userStreams = userConnections.filter(connection =>
      connection.status === "streaming")
    const userStreamNames = userStreams.map(connection =>
      connection.devicename)

    // Inform all active connections for this user.
    userConnections.map(connection =>
      connection.webSocket.sendUTF(JSON.stringify({
        type: "streams",
        streams: userStreamNames,
      }))
    )
  }

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

        if (connection.devicename) {
          connection.webSocket.sendUTF(JSON.stringify({
            type: "message",
            message: "Devicename already declared as " +
              `"${connection.devicename}".`
          }))
          return
        }

        if (!data.devicename.trim()) {
          connection.webSocket.sendUTF(JSON.stringify({
            type: "message",
            message: "Please include a name for your device.",
          }))
          return
        }

        if (connections.find(compareConnection =>
          compareConnection.username === connection.username &&
          compareConnection.devicename &&
          compareConnection.devicename.toLowerCase() ===
          data.devicename.trim().toLowerCase())) {

          connection.webSocket.sendUTF(JSON.stringify({
            type: "message",
            message: "Devicename already in use for your account.",
          }))
          return
        }

        connection.devicename = data.devicename.trim()

        connection.webSocket.sendUTF(JSON.stringify({
          type: "device",
          devicename: data.devicename.trim(),
          message: `Devicename set to "${data.devicename.trim()}".`,
          streams: connections.filter(compareConnection =>
            compareConnection.username === username &&
            compareConnection.devicename &&
            compareConnection.status === "streaming")
            .map(compareConnection => compareConnection.devicename),
        }))
        return

      case "status":
        if (!connection.username) {
          connection.webSocket.sendUTF(JSON.stringify({
            type: "message",
            message: "Please login or register."
          }))
          return
        }

        if (!connection.devicename) {
          connection.webSocket.sendUTF(JSON.stringify({
            type: "message",
            message: "Please provide a name for your device.",
          }))
          return
        }

        connection.status = data.status.trim()
        updateStreams(connection.username)
        return

      default:
        console.error("Unknown data:", data)
    }
  })
})