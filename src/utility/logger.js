const winston = require( 'winston' )

const logDirectory = process.env.WINSTON_LOG_PATH

const logger = winston.createLogger( {
  transports: [
    new winston.transports.Console( {
      level: process.env.WINSTON_CONSOLE_LEVEL || 'silly',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp( { format: 'YYYY-MM-DD HH:mm:ss' } ),
        winston.format.errors( { stack: true } ),
        winston.format.printf( ( info ) => {
          if ( !Object.prototype.hasOwnProperty.call( info, 'label' ) ) info.label = []
          if ( typeof info.message === 'object' && !Array.isArray( info.message ) ) info.message = JSON.stringify( info.message )
          return `(${ info.timestamp })[${ info.label.join( '.' ) }] ${ info.level }: ${ info.message }`
        } )
      )
    } )
  ]
} )

logger.add(
  new winston.transports.File( {
    filename: `${ logDirectory }/error.log`,
    level: process.env.WINSTON_LOG_ERROR_LEVEL || 'error',
    format: winston.format.combine(
      winston.format.timestamp( { format: 'YYYY-MM-DD HH:mm:ss' } ),
      winston.format.errors( { stack: true } ),
      winston.format.json()
    )
  } )
)

logger.add(
  new winston.transports.File( {
    filename: `${ logDirectory }/all.log`,
    level: process.env.WINSTON_LOG_ALL_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp( { format: 'YYYY-MM-DD HH:mm:ss' } ),
      winston.format.errors( { stack: true } ),
      winston.format.json()
    )
  } )
)

/**
 * Log to file and console
 * @param {String} level Level of log
 * @param {Array} identifier Array of identifier to where log is
 * @param {String} message Message
 */
logger.msg = ( arg1, arg2, arg3 ) => {
  const level = arg1; let message = ''; let label = []

  // Determine where arg2 is message or prefix judging if theres an arg3
  if ( arg3 !== undefined ) {
    message = arg3
    label = Array.isArray( arg2 ) ? arg2 : [ arg2 ]
  } else {
    message = arg2
  }

  logger.log( { level, message, label } )
}

module.exports = logger
