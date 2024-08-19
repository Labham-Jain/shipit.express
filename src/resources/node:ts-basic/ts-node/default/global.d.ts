export {}

type DefaultEnv = {
  NODE_ENV: 'development' | 'production'
}

type Env = {
  // add variables here...
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends DefaultEnv, Env {
    }
  }
}