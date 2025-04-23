import fs from "fs";

export class FsOps {
  constructor(private readonly dryRun: boolean) { }

  symlinkSync(target: fs.PathLike, path: fs.PathLike): void {
    if (!this.dryRun) {
      fs.symlinkSync(target, path);
      return;
    }
    console.log("SymLink", target, "to", path);
  }

  mkdirSync(path: fs.PathLike): void {
    if (!this.dryRun) {
      fs.mkdirSync(path);
      return;
    }
    console.log("MkDir", path);
  }

  renameSync(oldPath: fs.PathLike, newPath: fs.PathLike) {
    if (!this.dryRun) {
      fs.renameSync(oldPath, newPath);
      return;
    }
    console.log("Rename", oldPath, "->", newPath);
  }
}