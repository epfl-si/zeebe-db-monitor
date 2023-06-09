import clipboard from 'clipboardy'
import jq from 'node-jq';
import {getZeebeContent} from "./JsonExporter.js";
import path from "path";
import { promises as fs } from 'fs';


// certainly arriving from the cli
const parameter = process.argv[2];

if (!['clipboard', 'file'].includes(parameter)) {
  console.log("Add 'clipboard' or 'file' to the command")
  process.exit()
}

const getData = async () => {
  let dataToJson = await getZeebeContent()
  // dataToJson = await jq.run('.', dataToJson, { input: 'json' })
  return dataToJson
}

(async () => {
  if (parameter === 'clipboard') {

      await clipboard.write(
        JSON.stringify(await getData())
      );

      console.log(`output sent to the clipboard.`)

  } else if (parameter === 'file') {

    const defaultOutputFilePath = `${ path.join(process.env.PWD!, `snapshot-${ new Date().toJSON().slice(0, 19) }`) }.json`

    await fs.writeFile(defaultOutputFilePath,
      JSON.stringify(await getData(), null, 2)
    );

    console.log(`Saved into ${defaultOutputFilePath}`)
  }
})();
