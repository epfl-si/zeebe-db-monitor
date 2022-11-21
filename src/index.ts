import {expressApp} from "./webServer.js";
import {setSymlink} from "./folders.js";

// first step, set the symlinks correctly for the two folders
await setSymlink()

expressApp.listen(8080, () => console.log('Server metrics are currently exposed on /metrics...'));
