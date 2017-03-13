'use strict';

const Sequelize = require('sequelize');

class Database {
    constructor(process) {
        this.sequelize = null;

            if (process.env.DATABASE_URL) {
                // the application is executed on Heroku ... use the postgres database
                this.sequelize = new Sequelize(process.env.DATABASE_URL, {
                    dialect:  'postgres',
                    protocol: 'postgres',
                    logging:  true, //false
                    dialectOptions: {
                        ssl: true
                    }
                })
            } else {
                // the application is executed on the local machine ... use mysql
                this.sequelize = new Sequelize('mmorpg', 'mmorpg', 'morpg')
            }

        this.db = {
            Sequelize: Sequelize,
            sequelize: this.sequelize,
            User:      this.sequelize.import(__dirname + '/models/user')
                // add your other models here
        }

    }

    createUser(user, callback) {
        this.sequelize.sync().then(function() {
            this.db.User.create({
                name: user.name,
                username: user.username,
                pass: user.pass,
            }).then(callback)
            .catch(function(err) {
                console.log(err);
            });
        }.bind(this));
    }

    loadUser(user, callback) {
        // search for attributes
        this.sequelize.sync().then(function() {
            this.db.User.find({ where: user }).then(callback)
            .catch(function(err) {
                console.log(err);
            });
        }.bind(this));

    }
}

module.exports = Database;
