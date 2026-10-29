import { pathToFileURL } from 'node:url';

/** Run `main(args)` when the module is the entry point; print the error message and exit 1 if it throws. */
export function runIfMain(moduleUrl, main) {
  if (!process.argv[1] || moduleUrl !== pathToFileURL(process.argv[1]).href) return;
  try {
    main(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
