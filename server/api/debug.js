export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  return {
    runtimeConfigKeys: Object.keys(config),
    glmApiKey: config.glmApiKey ? '***' + config.glmApiKey.slice(-4) : null,
    processEnvKeys: Object.keys(process.env).filter(key => key.includes('GLM') || key.includes('DING') || key.includes('NUXT')),
    GLM_API_KEY: process.env.GLM_API_KEY ? '***' + process.env.GLM_API_KEY.slice(-4) : null,
    NODE_ENV: process.env.NODE_ENV,
    envFile: process.env.ENV_FILE || 'not set'
  }
})