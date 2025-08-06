#!/usr/bin/env node

/**
 * Setup script to copy FFmpeg WebAssembly files to public directory
 * This needs to be run after npm install
 */

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { copyFile, mkdir, access } from 'fs/promises'
import { constants } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')
const publicDir = join(projectRoot, 'public')

const FFMPEG_FILES = [
  'ffmpeg-core.js',
  'ffmpeg-core.wasm'
]

const WORKER_FILES = [
  { src: 'worker.js', dest: 'ffmpeg-core.worker.js' }
]

async function fileExists(path) {
  try {
    await access(path, constants.F_OK)
    return true
  } catch {
    return false
  }
}

async function copyFFmpegFiles() {
  console.log('Setting up FFmpeg WebAssembly files...')

  // Ensure public directory exists
  try {
    await mkdir(publicDir, { recursive: true })
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.error('Failed to create public directory:', error)
      return
    }
  }

  // Look for ffmpeg core files in node_modules
  const coreSourcePaths = [
    join(projectRoot, 'node_modules', '@ffmpeg', 'core-mt', 'dist', 'esm'),
    join(projectRoot, 'node_modules', '@ffmpeg', 'core', 'dist', 'esm'),
    join(projectRoot, 'node_modules', '@ffmpeg', 'core', 'dist', 'umd')
  ]

  let coreSourceDir = null
  for (const path of coreSourcePaths) {
    const coreFile = join(path, 'ffmpeg-core.js')
    if (await fileExists(coreFile)) {
      coreSourceDir = path
      console.log('Found FFmpeg core files at:', coreSourceDir)
      break
    }
  }

  // Look for worker files in @ffmpeg/ffmpeg
  const workerSourcePaths = [
    join(projectRoot, 'node_modules', '@ffmpeg', 'ffmpeg', 'dist', 'esm'),
    join(projectRoot, 'node_modules', '@ffmpeg', 'ffmpeg', 'dist', 'umd')
  ]

  let workerSourceDir = null
  for (const path of workerSourcePaths) {
    const workerFile = join(path, 'worker.js')
    if (await fileExists(workerFile)) {
      workerSourceDir = path
      console.log('Found FFmpeg worker files at:', workerSourceDir)
      break
    }
  }

  if (!coreSourceDir && !workerSourceDir) {
    console.warn('FFmpeg files not found. Please install @ffmpeg/ffmpeg and @ffmpeg/core packages.')
    console.log('Files will be loaded from CDN at runtime.')
    return
  }

  // Copy core files
  if (coreSourceDir) {
    for (const fileName of FFMPEG_FILES) {
      const sourcePath = join(coreSourceDir, fileName)
      const destPath = join(publicDir, fileName)

      try {
        if (await fileExists(sourcePath)) {
          await copyFile(sourcePath, destPath)
          console.log(`✓ Copied ${fileName}`)
        } else {
          console.warn(`⚠ File not found: ${fileName}`)
        }
      } catch (error) {
        console.error(`✗ Failed to copy ${fileName}:`, error.message)
      }
    }
  }

  // Copy worker files
  if (workerSourceDir) {
    for (const { src, dest } of WORKER_FILES) {
      const sourcePath = join(workerSourceDir, src)
      const destPath = join(publicDir, dest)

      try {
        if (await fileExists(sourcePath)) {
          await copyFile(sourcePath, destPath)
          console.log(`✓ Copied ${src} -> ${dest}`)
        } else {
          console.warn(`⚠ File not found: ${src}`)
        }
      } catch (error) {
        console.error(`✗ Failed to copy ${src}:`, error.message)
      }
    }
  }

  console.log('FFmpeg setup complete!')
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  copyFFmpegFiles().catch(error => {
    console.error('Setup failed:', error)
    process.exit(1)
  })
}

export { copyFFmpegFiles }