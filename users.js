const Sequelize = require("sequelize")
const bcrypt = require("bcrypt")

const { User } = require("./models")

const register = async data => {
  try {

    if (!data.username.trim()) {
      return {
        type: "message",
        message: "Please include a username.",
      }
    }

    if (!data.password.trim()) {
      return {
        type: "message",
        message: "Please include a password.",
      }
    }

    if (!data.confirmPassword.trim()) {
      return {
        type: "message",
        message: "Please include a password confirmation.",
      }
    }

    if (data.username.trim().toLowerCase() ===
      data.password.trim().toLowerCase()) {
      return {
        type: "message",
        message: "Username cannot be identical to password.",
      }
    }

    if (data.password.trim().toLowerCase() !==
      data.confirmPassword.trim().toLowerCase()) {
      return {
        type: "message",
        message: "Password and confirmation do not match.",
      }
    }

    const duplicateUsername = await User.findOne({
      where: {
        username: {
          [Sequelize.Op.iLike]: data.username.trim()
        }
      }
    })
    if (duplicateUsername) {
      return {
        type: "message",
        message: "Username already exists.",
      }
    }

    const encryptedPassword = await bcrypt
      .hashSync(data.password.trim().toLowerCase(), 10)
    const user = await User.create({
      username: data.username.trim(),
      password: encryptedPassword,
    })
    return {
      type: "login",
      username: user.username,
      message: `Registered account "${user.username}".`
    }

  } catch (error) {
    console.error(error)
    return {
      type: "message",
      message: "Internal server error.",
    }
  }
}

const login = async data => {
  try {

    if (!data.username.trim()) {
      return {
        type: "message",
        message: "Please include a username.",
      }
    }

    if (!data.password.trim()) {
      return {
        type: "message",
        message: "Please include a password.",
      }
    }

    const user = await User.findOne({
      where: {
        username: {
          [Sequelize.Op.iLike]: data.username.trim()
        }
      }
    })
    if (!user) {
      return {
        type: "message",
        message: "Username not found.",
      }
    }

    const conparePassword = await bcrypt
      .compareSync(data.password.trim().toLowerCase(), user.password)
    if (!conparePassword) {
      return {
        type: "message",
        message: "Incorrect password.",
      }
    }

    return {
      type: "login",
      username: user.username,
      message: `Logged into account "${user.username}".`
    }

  } catch (error) {
    console.error(error)
    return {
      type: "message",
      message: "Internal server error.",
    }
  }
}

module.exports = { register, login }