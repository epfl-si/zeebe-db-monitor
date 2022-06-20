import {expressApp} from "./webServer";
import {zdb} from "./zeebeDB";

require('dotenv').config()

expressApp.listen(8080, () => console.log('Server metrics are currently exposed on /metrics...'));

process.on( 'SIGINT', function() {
  console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
  // some other closing procedures go here
  zdb.db.close()
  process.exit( );
})
