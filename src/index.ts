import {expressApp} from "./webServer.js";

expressApp.listen(8080, () => console.log('Server metrics are currently exposed on /metrics...'));
