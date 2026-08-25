import { useEffect, useState } from 'react'
import { fetchHealth, type HealthStatus } from './api'
import './styles.css'

function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    fetchHealth()
      .then((result) => {
        if (mounted) setHealth(result)
      })
      .catch((reason: unknown) => {
        if (mounted) {
          setError(reason instanceof Error ? reason.message : 'Không thể kết nối tới máy chủ.')
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  return (
    <main className="page-shell">
      <section className="hero" aria-labelledby="app-title">
        <p className="eyebrow">QUẢN LÝ VẬN HÀNH</p>
        <h1 id="app-title">MiniApart</h1>
        <p className="hero-copy">
          Một nơi rõ ràng để quản lý toà nhà, phòng và những khoản thu hằng tháng.
        </p>
      </section>

      <section className="status-card" aria-labelledby="status-title">
        <div className="status-card__heading">
          <div>
            <p className="eyebrow">BẢN KIỂM TRA KẾT NỐI</p>
            <h2 id="status-title">Trạng thái hệ thống</h2>
          </div>
          <span className={`status-badge ${health ? 'status-badge--up' : 'status-badge--pending'}`}>
            {health ? 'Đang hoạt động' : error ? 'Cần kiểm tra' : 'Đang kiểm tra'}
          </span>
        </div>

        {error ? (
          <p className="status-message status-message--error" role="alert">
            {error}
          </p>
        ) : health ? (
          <dl className="status-list">
            <div>
              <dt>Ứng dụng</dt>
              <dd>{health.status}</dd>
            </div>
            <div>
              <dt>Cơ sở dữ liệu</dt>
              <dd>{health.database}</dd>
            </div>
          </dl>
        ) : (
          <p className="status-message" aria-live="polite">
            Đang lấy trạng thái từ máy chủ…
          </p>
        )}
      </section>
    </main>
  )
}

export default App
