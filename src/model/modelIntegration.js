const mongo = require('../databaseMongo/mongo')
const templateSchema = require( "./templateSchema" )

/**
 * Initiate a schema instance by the MongoDb name
 * @param {String} dbName MongoDb Table name
 * @returns MongoDb Schema instance of template
 */
module.exports = () => {
  return mongo.model( "Field", templateSchema )
}
