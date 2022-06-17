import {expressApp} from "./webServer";
import {zdb} from "./zeebeDB";

require('dotenv').config()

expressApp.listen(8080, () => console.log('Server is running on http://localhost:8080, metrics are exposed on http://localhost:8080/metrics'));

process.on( 'SIGINT', function() {
  console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
  // some other closing procedures go here
  zdb.db.close()
  process.exit( );
})
