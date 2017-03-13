'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define("User", {
        name: DataTypes.STRING,
        username: DataTypes.STRING,
        pass: DataTypes.STRING
    })
}
