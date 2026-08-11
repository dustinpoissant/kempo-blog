import { readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

/*
  Every server-side module must at least load.

  This extension resolves ~42 imports out of the host `kempo` package, so it breaks in two ways
  nothing else notices until a request comes in: a relative import that climbs the wrong number of
  directories, or the host moving something this package reaches into. Importing the whole surface
  turns both into a build failure.

  public/components/* is excluded — those are browser modules importing absolute /kempo-ui/... URLs.
*/

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const ROUTE_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

const walk = async dir => {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for(const entry of entries){
    const full = path.join(dir, entry.name);
    if(entry.isDirectory()){
      files.push(...await walk(full));
    } else if(entry.name.endsWith('.js')){
      files.push(full);
    }
  }
  return files;
};

const dirs = ['server', 'hooks', 'public/api'];
const singles = ['install.js', 'update.js', 'sdk.js'];

const files = [
  ...(await Promise.all(dirs.map(d => walk(path.join(root, d))))).flat(),
  ...singles.map(f => path.join(root, f)),
];

const isRouteHandler = file => {
  const name = path.basename(file, '.js');
  return file.replace(/\\/g, '/').includes('/api/') && ROUTE_METHODS.includes(name);
};

const tests = {
  'module surface is discoverable': async ({ pass, fail }) => {
    if(files.length < 20){
      return fail(`only found ${files.length} modules — the surface list is probably wrong, so this suite would pass without checking anything`);
    }
    pass();
  }
};

for(const file of files){
  const rel = path.relative(root, file).replace(/\\/g, '/');

  tests[`imports ${rel}`] = async ({ pass, fail }) => {
    let module;
    try {
      module = await import(pathToFileURL(file).href);
    } catch(e) {
      return fail(`${e.code || e.constructor.name}: ${e.message.split('\n')[0]}`);
    }

    if(isRouteHandler(file) && typeof module.default !== 'function'){
      return fail(`route handler has no default export function (got ${typeof module.default})`);
    }

    pass();
  };
}

export default tests;
