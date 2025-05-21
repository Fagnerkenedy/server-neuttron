const mongoose = require( 'mongoose' )
const Schema = mongoose.Schema

/**
 * A Mongoose schema definition for a specific data model.
 * The schema defines the structure and properties of the model, including data types and default values.
 */
module.exports = new Schema( {
  name: String,
  api: String,
  type: String,
  module: String,
  lookup_field: String,

  /*originalId: {
    type: String,
    required: true,
    index: true
  },
  toCRM: {
    crmId: {
      type: String,
      default: null,
      index: true
    },
    updatedAt: {
      type: Number,
      default: 0
    },
    returnData: {
      type: Object
    }
  },
  originalData: {
    type: Object,
    required: true
  },
  status: {
    type: String,
    default: 'pending'
  },
  error: {
    type: Object
  },
  hasRelationships: { // Record has field(s) for ONLY one relationship
    type: Boolean,
    default: false
  },
  hasMultilookup: { // Record has field(s) with an array of relationships
    type: Boolean,
    default: false
  },
  importAction: { // Last action by import, "insert" || "update" -- Field to be used with updateAfterIntegration when true
    type: String,
    default: null
  },
  updateAfterIntegration: { // Boolean if after importing record if it should update the origin
    type: Boolean,
    default: false
  }*/
}, { timestamps: true } )
