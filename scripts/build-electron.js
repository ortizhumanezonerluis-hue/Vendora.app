import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

console.log('1. Compilando TypeScript de Electron...')
execSync('npx tsc -p tsconfig.electron.json', { stdio: 'inherit' })

console.log('2. Configurando módulo CommonJS para Electron...')
const distElectronDir = path.join(process.cwd(), 'dist-electron')
if (!fs.existsSync(distElectronDir)) {
  fs.mkdirSync(distElectronDir, { recursive: true })
}
fs.writeFileSync(path.join(distElectronDir, 'package.json'), JSON.stringify({ type: 'commonjs' }, null, 2))

console.log('3. Compilando interfaz React con Vite...')
execSync('npx vite build', { stdio: 'inherit' })

console.log('✓ Compilación completada con éxito.')
