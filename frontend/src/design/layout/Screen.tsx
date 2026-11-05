import { useEffect, useState, type CSSProperties } from 'react'
import type * as React from 'react'

export function ScreenSurface({ printable = false, children, className, ...rest }: React.HTMLAttributes<HTMLElement> & { printable?: boolean }): React.ReactElement {
  return <>
    {printable ? <style data-invoice-print>{'@page { size: A4; margin: 12mm; } @media print { .ma-no-print { display: none !important } .ma-app-shell { display: block !important; min-height: 0 !important; padding: 0 !important; background: transparent !important; } .ma-app-shell > div { display: block !important; padding: 0 !important; } .ma-app-shell > div > section { display: block !important; padding: 0 !important; } .ma-printable { padding: 0 !important; border: 0 !important; box-shadow: none !important; max-width: none !important; overflow: visible !important; } }'}</style> : null}
    <section className={`${printable ? 'ma-printable ' : ''}${className ?? ''}${printable ? ' invoice-printable' : ''}`.trim()} style={{ display: 'grid', gap: 16, padding: 'clamp(16px, 4vw, 32px)', border: '1px solid var(--ma-border-default)', background: 'var(--ma-bg-card)', maxWidth: '100%', minWidth: 0, overflow: 'hidden' }} {...rest}>{children}</section>
  </>
}

export function ScreenHeader({ children, action }: { children: React.ReactNode; action?: React.ReactNode }): React.ReactElement {
  return <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}><div>{children}</div>{action}</div>
}

export function ScreenNotice({ children, tone = 'muted', live }: { children: React.ReactNode; tone?: 'muted' | 'urgent'; live?: boolean }): React.ReactElement {
  return <p role={tone === 'urgent' ? 'alert' : undefined} aria-live={live ? 'polite' : undefined} style={{ margin: 0, color: tone === 'urgent' ? 'var(--ma-urgent)' : 'var(--ma-text-secondary)', lineHeight: 1.6 }}>{children}</p>
}

export function MetaGrid({ children }: { children: React.ReactNode }): React.ReactElement { return <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(10rem, 100%), 1fr))', gap: 12, margin: 0 }}>{children}</dl> }
export function MetaItem({ label, children }: { label: React.ReactNode; children: React.ReactNode }): React.ReactElement { return <div style={{ padding: 12, border: '1px solid var(--ma-border-default)', background: 'var(--ma-bg-sunken)' }}><dt style={{ color: 'var(--ma-text-secondary)' }}>{label}</dt><dd style={{ margin: '5px 0 0', color: 'var(--ma-text-primary)', fontWeight: 800 }}>{children}</dd></div> }
export function HighlightNotice({ children }: { children: React.ReactNode }): React.ReactElement { return <p style={{ margin: 0, padding: '12px 16px', borderLeft: '4px solid var(--ma-bg-inverse)', background: 'var(--ma-bg-sunken)', lineHeight: 1.6 }}>{children}</p> }

export function TableFrame({ children, minWidth = 600 }: { children: React.ReactNode; minWidth?: number }): React.ReactElement { return <div style={{ overflowX: 'auto', border: '1px solid var(--ma-border-default)', contain: 'paint' }}><table style={{ width: '100%', minWidth, borderCollapse: 'collapse', tableLayout: 'fixed', textAlign: 'left' }}>{children}</table></div> }
export function TableHeadCell({ children, align = 'left', colSpan }: { children: React.ReactNode; align?: 'left' | 'right'; colSpan?: number }): React.ReactElement { return <th scope="col" colSpan={colSpan} style={{ padding: 12, borderBottom: '1px solid var(--ma-border-default)', textAlign: align, color: 'var(--ma-text-secondary)' }}>{children}</th> }
export function TableCell({ children, header = false, align = 'left', muted = false }: { children: React.ReactNode; header?: boolean; align?: 'left' | 'right'; muted?: boolean }): React.ReactElement { const Tag = header ? 'th' : 'td'; return <Tag {...(header ? { scope: 'row' as const } : {})} style={{ padding: 12, borderBottom: '1px solid var(--ma-border-default)', textAlign: align, verticalAlign: 'top', overflowWrap: 'anywhere', color: muted ? 'var(--ma-text-secondary)' : undefined }}>{children}</Tag> }
export function TableActions({ children }: { children: React.ReactNode }): React.ReactElement { return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{children}</div> }
export function MeterImage({ src, alt, imageId, onRefresh }: {
  src: string
  alt: string
  imageId?: number | null
  onRefresh?: () => Promise<string>
}): React.ReactElement {
  const [imageSrc, setImageSrc] = useState(src)
  const [trangThai, setTrangThai] = useState<'dang-tai' | 'da-tai' | 'het-han'>('dang-tai')
  const [dangXinLai, setDangXinLai] = useState(false)
  const [loiXinLai, setLoiXinLai] = useState<string | null>(null)

  useEffect(() => {
    setImageSrc(src)
  }, [src])

  useEffect(() => {
    setTrangThai('dang-tai')
    setLoiXinLai(null)
    const hetHan = layHetHan(imageSrc)
    if (hetHan == null) return
    const timeoutId = window.setTimeout(() => setTrangThai('het-han'), Math.max(0, hetHan * 1000 - Date.now()))
    return () => window.clearTimeout(timeoutId)
  }, [imageSrc])

  async function xinLaiLienKet() {
    if (!onRefresh) return
    setDangXinLai(true)
    setLoiXinLai(null)
    try {
      setImageSrc(await onRefresh())
      setTrangThai('dang-tai')
    } catch {
      setLoiXinLai('Không thể lấy lại liên kết ảnh công tơ.')
      setTrangThai('het-han')
    } finally {
      setDangXinLai(false)
    }
  }

  const buttonStyle: CSSProperties = {
    minHeight: 44,
    padding: '8px 12px',
    border: '1px solid var(--ma-border-strong)',
    background: 'var(--ma-bg-card)',
    color: 'var(--ma-text-primary)',
    font: 'inherit',
    fontWeight: 700,
    cursor: dangXinLai ? 'wait' : 'pointer',
  }

  return (
    <figure data-meter-image={imageId ?? undefined} className="ma-no-print" aria-busy={trangThai === 'dang-tai' || dangXinLai} style={{ display: 'grid', gap: 8, margin: '10px 0 0', maxWidth: 280 }}>
      <figcaption style={{ color: 'var(--ma-text-secondary)', fontSize: 13 }}>Ảnh công tơ</figcaption>
      {trangThai === 'dang-tai' ? <p role="status" style={{ margin: 0, color: 'var(--ma-text-secondary)', fontSize: 13 }}>Đang lấy ảnh công tơ…</p> : null}
      <img
        width={240}
        height={160}
        loading="lazy"
        decoding="async"
        style={{ display: 'block', width: '100%', height: 'auto', maxWidth: '100%', maxHeight: 160, objectFit: 'contain' }}
        src={imageSrc}
        alt={alt}
        onLoad={() => {
          const hetHan = layHetHan(imageSrc)
          setTrangThai(hetHan != null && Date.now() >= hetHan * 1000 ? 'het-han' : 'da-tai')
        }}
        onError={() => setTrangThai('het-han')}
      />
      <a
        className="ma-no-print"
        data-view-meter={imageId ?? undefined}
        href={imageSrc}
        target="_blank"
        rel="noreferrer"
        style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, color: 'var(--ma-text-primary)', fontSize: 13, fontWeight: 700, textUnderlineOffset: 3 }}
      >
        Mở ảnh công tơ bản đầy đủ
      </a>
      {trangThai === 'het-han' ? (
        <div role="alert" style={{ display: 'grid', gap: 8, color: 'var(--ma-urgent)', fontSize: 13 }}>
          <span>Liên kết ảnh công tơ đã hết hạn hoặc không thể tải.</span>
          {loiXinLai ? <span>{loiXinLai}</span> : null}
          {onRefresh ? (
            <button
              type="button"
              className="ma-no-print"
              data-refresh-meter={imageId ?? undefined}
              disabled={dangXinLai}
              onClick={() => void xinLaiLienKet()}
              style={buttonStyle}
            >
              {dangXinLai ? 'Đang lấy lại ảnh…' : 'Lấy lại ảnh công tơ'}
            </button>
          ) : null}
        </div>
      ) : null}
    </figure>
  )
}
function layHetHan(src: string): number | null {
  try {
    const hetHan = Number(new URL(src, 'http://miniapart.local').searchParams.get('hetHan'))
    return Number.isFinite(hetHan) && hetHan > 0 ? hetHan : null
  } catch {
    return null
  }
}
export function TotalLine({ children }: { children: React.ReactNode }): React.ReactElement { return <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, alignItems: 'baseline', flexWrap: 'wrap' }}>{children}</div> }

export function FormPanel({ children, onSubmit, testId }: { children: React.ReactNode; onSubmit: React.FormEventHandler<HTMLFormElement>; testId?: string }): React.ReactElement { return <form data-testid={testId} onSubmit={onSubmit} style={{ display: 'grid', gap: 16, padding: 16, border: '1px solid var(--ma-border-default)', minWidth: 0 }}>{children}</form> }
export function FormField({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement { return <label style={{ display: 'grid', gap: 6, minWidth: 0 }}><span>{label}</span>{children}</label> }
export function CheckboxGroup({ legend, children }: { legend: string; children: React.ReactNode }): React.ReactElement { return <fieldset style={{ display: 'grid', gap: 10, margin: 0, padding: 0, border: 0 }}><legend>{legend}</legend>{children}</fieldset> }
export function CheckboxField({ children }: { children: React.ReactNode }): React.ReactElement { return <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 44 }}>{children}</label> }
export function ActionRow({ children }: { children: React.ReactNode }): React.ReactElement { return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{children}</div> }
