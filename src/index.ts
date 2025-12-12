import {expressApp} from "./webServer.js";

expressApp.listen(8081, () => console.log('Server metrics are currently exposed on :8081/metrics...'));
