// helpers for dynamic module imports

let cache = window.DCRScripts = window.DCRScripts || {}

function rejection (reason) {
  return new Promise((resolve, reject) => {
    reject(reason)
  })
}

export async function getDefault (k) {
  if (cache.hasOwnProperty(k)) {
    return new Promise(resolve => {
      resolve(cache[k])
    })
  }
  let module
  try {
    switch (k) {
      case 'dygraph':
        module = await import(/* webpackChunkName: "dygraphs" */ '../vendor/dygraphs.min.js')
        break
      case 'qrcode':
        module = await import(/* webpackChunkName: "qrcode" */ 'qrcode')
        break
      case 'charts':
        module = await import(/* webpackChunkName: "charts" */ '../vendor/charts.min.js')
        break
      default:
        return rejection(`unknown script ${k}`)
    }
  } catch (err) {
    return rejection(err)
  }
  cache[k] = module.default
  console.log('module', module)
  return new Promise(resolve => {
    resolve(module.default)
  })
}
