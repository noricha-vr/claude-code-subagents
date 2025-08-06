export interface SystemCapabilities {
  sharedArrayBuffer: boolean
  webAssembly: boolean
  workers: boolean
  crossOriginIsolated: boolean
  browserInfo: {
    name: string
    version: string
    userAgent: string
  }
  memoryInfo?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }
}

export const checkSystemCapabilities = (): SystemCapabilities => {
  // Check SharedArrayBuffer support
  const sharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined'
  
  // Check WebAssembly support
  const webAssembly = typeof WebAssembly !== 'undefined' && typeof WebAssembly.instantiate === 'function'
  
  // Check Web Workers support
  const workers = typeof Worker !== 'undefined'
  
  // Check Cross-Origin Isolation
  const crossOriginIsolationStatus = typeof (globalThis as any).crossOriginIsolated !== 'undefined' ? (globalThis as any).crossOriginIsolated : false

  // Get browser information
  const userAgent = navigator.userAgent
  let browserName = 'Unknown'
  let browserVersion = 'Unknown'

  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browserName = 'Chrome'
    const match = userAgent.match(/Chrome\/(\d+)/)
    if (match) browserVersion = match[1]
  } else if (userAgent.includes('Firefox')) {
    browserName = 'Firefox'
    const match = userAgent.match(/Firefox\/(\d+)/)
    if (match) browserVersion = match[1]
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browserName = 'Safari'
    const match = userAgent.match(/Version\/(\d+)/)
    if (match) browserVersion = match[1]
  } else if (userAgent.includes('Edg')) {
    browserName = 'Edge'
    const match = userAgent.match(/Edg\/(\d+)/)
    if (match) browserVersion = match[1]
  }

  // Get memory information if available
  let memoryInfo: SystemCapabilities['memoryInfo']
  if ('memory' in performance && (performance as any).memory) {
    const memory = (performance as any).memory
    memoryInfo = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit
    }
  }

  return {
    sharedArrayBuffer,
    webAssembly,
    workers,
    crossOriginIsolated: crossOriginIsolationStatus,
    browserInfo: {
      name: browserName,
      version: browserVersion,
      userAgent
    },
    memoryInfo
  }
}

export const getCompatibilityIssues = (capabilities: SystemCapabilities): string[] => {
  const issues: string[] = []

  if (!capabilities.sharedArrayBuffer) {
    issues.push(
      'SharedArrayBufferがサポートされていません。Cross-Origin Isolationの設定が必要です。'
    )
  }

  if (!capabilities.webAssembly) {
    issues.push('WebAssemblyがサポートされていません。')
  }

  if (!capabilities.workers) {
    issues.push('Web Workersがサポートされていません。')
  }

  if (!capabilities.crossOriginIsolated) {
    issues.push(
      'Cross-Origin Isolationが有効になっていません。サーバーのヘッダー設定が必要です。'
    )
  }

  // Check browser compatibility
  const { name, version } = capabilities.browserInfo
  const versionNum = parseInt(version)

  if (name === 'Chrome' && versionNum < 88) {
    issues.push('Chrome 88以降を推奨します。')
  } else if (name === 'Firefox' && versionNum < 79) {
    issues.push('Firefox 79以降を推奨します。')
  } else if (name === 'Safari' && versionNum < 15) {
    issues.push('Safari 15以降を推奨します。')
  } else if (name === 'Edge' && versionNum < 88) {
    issues.push('Microsoft Edge 88以降を推奨します。')
  }

  // Check memory (if available)
  if (capabilities.memoryInfo) {
    const availableMemory = capabilities.memoryInfo.jsHeapSizeLimit - capabilities.memoryInfo.usedJSHeapSize
    const minRequiredMemory = 100 * 1024 * 1024 // 100MB
    
    if (availableMemory < minRequiredMemory) {
      issues.push('利用可能なメモリが少ない可能性があります。')
    }
  }

  return issues
}

export const formatMemorySize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const logSystemInfo = (): void => {
  const capabilities = checkSystemCapabilities()
  const issues = getCompatibilityIssues(capabilities)
  
  console.group('🔧 System Information')
  console.log('SharedArrayBuffer:', capabilities.sharedArrayBuffer ? '✅' : '❌')
  console.log('WebAssembly:', capabilities.webAssembly ? '✅' : '❌')
  console.log('Web Workers:', capabilities.workers ? '✅' : '❌')
  console.log('Cross-Origin Isolated:', capabilities.crossOriginIsolated ? '✅' : '❌')
  console.log('Browser:', `${capabilities.browserInfo.name} ${capabilities.browserInfo.version}`)
  
  if (capabilities.memoryInfo) {
    console.log('Memory Usage:', formatMemorySize(capabilities.memoryInfo.usedJSHeapSize))
    console.log('Memory Limit:', formatMemorySize(capabilities.memoryInfo.jsHeapSizeLimit))
  }
  
  if (issues.length > 0) {
    console.group('⚠️ Compatibility Issues')
    issues.forEach(issue => console.warn(issue))
    console.groupEnd()
  }
  
  console.groupEnd()
}