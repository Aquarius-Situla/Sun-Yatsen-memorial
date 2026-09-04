import { copyFileSync } from 'node:fs'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  treeshake: true,
  external: ['react', 'react-dom', 'motion'],
  // the stylesheet ships alongside, imported via 'playcaptcha/clawcaptcha.css'.
  // the toy renders + logo live in assets/ and are served statically by the app.
  onSuccess: async () => {
    copyFileSync('src/clawcaptcha.css', 'dist/clawcaptcha.css')
  },
})
