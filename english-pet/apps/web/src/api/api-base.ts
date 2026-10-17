// 开发时连接本机后台；部署后默认使用同源转发，也可显式指定独立 API 地址。
export const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:8787' : '')).replace(/\/$/, '')
