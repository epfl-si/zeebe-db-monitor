import {expressApp} from "./webServer";

require('dotenv').config()

expressApp.listen(8080, () => console.log('Server metrics are currently exposed on /metrics...'));
