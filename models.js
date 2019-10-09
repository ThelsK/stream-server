const Sequelize = require("sequelize")

const database = require("./database")

const User = database.define("user",
  {
    username: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  }
)

const Device = database.define("device",
  {
    devicename: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  }
)

User.hasMany(Device)
Device.belongsTo(User)

module.exports = { User, Device }