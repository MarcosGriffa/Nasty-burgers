// Vite resuelve los imports sin extension; node no. Esto le ensena a node a
// hacer lo mismo, para poder correr los tests sin bundler ni dependencias.
import { register } from 'node:module'
import { pathToFileURL } from 'node:url'
register('./loader.mjs', pathToFileURL(import.meta.filename))
