import {Dirent, readdirSync} from "fs";

/** Provide the list of folder inside a provided path */
export const getDirectories = (path: string) =>
  (readdirSync(path, { withFileTypes: true }))
    .filter((dirent: Dirent) => dirent.isDirectory())
    .map((dirent: Dirent) => dirent.name)
