import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import tailwindcss from "@tailwindcss/vite";

const repositoryTarget = 'simple-dj-mixer/'

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  base: `/${repositoryTarget}`,
  build: {
    target: 'esnext',
  },
})
