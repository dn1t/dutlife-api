import { dirname, fromFileUrl, resolve } from 'path';
import { walkSync } from 'walk';

const __dirname__ = dirname(fromFileUrl(import.meta.url));
const path = resolve(__dirname__, './routes');
const files = Array.from(walkSync(path))
  .filter(({ isFile }) => isFile)
  .reduce<Record<string, string>>((prev, curr) => {
    prev[
      curr.path.slice(path.length, curr.path.lastIndexOf('.'))
    ] = `.${curr.path.slice(path.lastIndexOf('/'))}`;
    return prev;
  }, {});

const imports = Object.values(files).reduce((prev, path, index) => {
  return `${prev}import $${index} from "${path}";\n`;
}, '');

const exports = `\nexport default {\n${Object.keys(files).reduce(
  (prev, name, index) => {
    return `${prev}\t"${name}": $${index}${',\n'}`;
  },
  '',
)}};\n`;

Deno.writeTextFileSync(resolve(__dirname__, './routes.ts'), imports + exports);
