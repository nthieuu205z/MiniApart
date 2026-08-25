export type HealthStatus = {
  status: string
  database: string
}

export async function fetchHealth(): Promise<HealthStatus> {
  const response = await fetch('/api/health')

  if (!response.ok) {
    throw new Error('Không thể kết nối tới máy chủ.')
  }

  return response.json() as Promise<HealthStatus>
}
