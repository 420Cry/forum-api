/**
 * Nest CLI path rewrite skips `src/...` when the compiler runs under Bun
 * (Bun's require.resolve treats `src/` as a filesystem path). Rewrite those
 * requires in dist so `start:prod` works in the Docker image.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'

const distRoot = resolve('dist')
const srcRequire = /require\(["']src\/([^"']+)["']\)/g

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) await walk(path)
    else if (entry.name.endsWith('.js')) await rewrite(path)
  }
}

async function rewrite(file) {
  const original = await readFile(file, 'utf8')
  const updated = original.replace(srcRequire, (_match, spec) => {
    const target = join(distRoot, spec)
    let rel = relative(dirname(file), target).replaceAll('\\', '/')
    if (!rel.startsWith('.')) rel = `./${rel}`
    return `require("${rel}")`
  })
  if (updated !== original) await writeFile(file, updated)
}

await walk(distRoot)
