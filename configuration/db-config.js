
var MongoClient = require( 'mongodb' ).MongoClient;
module.exports = {
  connectToServer: function( callback ) {
    MongoClient.connect( "mongodb://127.0.0.1:27017/YouTube", { useNewUrlParser: true }, function( err, client ) {
      console.log(client)
      db = client.db("YouTube");
      return callback(err);
    } );
  }
};