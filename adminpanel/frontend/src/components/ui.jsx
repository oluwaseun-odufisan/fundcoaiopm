//ui.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export const PageHeader = ({ eyebrow, title, description, actions }) => (
  <div
    className="relative overflow-hidden rounded-[2rem] border p-6 lg:p-8"
    style={{
      borderColor: 'var(--c-border)',
      background: 'linear-gradient(135deg, color-mix(in srgb, var(--c-accent) 14%, transparent), color-mix(in srgb, var(--c-accent-2) 12%, transparent))',
    }}
  >
    <div className="hero-orb h-36 w-36 -left-8 -top-8" style={{ background: 'color-mix(in srgb, var(--c-accent) 28%, transparent)' }} />
    <div className="hero-orb h-32 w-32 right-10 top-4" style={{ background: 'color-mix(in srgb, var(--c-accent-2) 26%, transparent)' }} />
    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow ? <p className="section-title mb-3">{eyebrow}</p> : null}
        <h1 className="text-3xl font-black tracking-tight lg:text-4xl" style={{ color: 'var(--c-text-0)', fontFamily: 'var(--font-display)' }}>
          {title}
        </h1>
        {description ? <p className="mt-3 max-w-2xl text-sm lg:text-base" style={{ color: 'var(--c-text-2)' }}>{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  </div>
);

export const StatCard = ({ label, value, icon: Icon, tone = 'var(--c-accent)', helper, right }) => (
  <div className="card card-hover p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="section-title mb-3">{label}</p>
        <p className="stat-value text-3xl" style={{ color: tone }}>{value}</p>
        {helper ? <p className="mt-2 text-sm" style={{ color: 'var(--c-text-3)' }}>{helper}</p> : null}
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `color-mix(in srgb, ${tone} 14%, transparent)` }}>
        <Icon className="h-5 w-5" style={{ color: tone }} />
      </div>
    </div>
    {right ? <div className="mt-4">{right}</div> : null}
  </div>
);

export const Panel = ({ title, subtitle, action, children, className = '' }) => (
  <section className={`card ${className}`}>
    {(title || action) && (
      <div className="flex items-start justify-between gap-3 border-b px-5 py-4 lg:px-6" style={{ borderColor: 'var(--c-border-subtle)' }}>
        <div>
          {title ? <h2 className="text-base font-bold" style={{ color: 'var(--c-text-0)' }}>{title}</h2> : null}
          {subtitle ? <p className="mt-1 text-sm" style={{ color: 'var(--c-text-3)' }}>{subtitle}</p> : null}
        </div>
        {action}
      </div>
    )}
    <div className="p-5 lg:p-6">{children}</div>
  </section>
);

export const FilterChip = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className="rounded-full px-4 py-2 text-xs font-bold transition-all"
    style={
      active
        ? { background: 'var(--gradient-brand)', color: 'white', boxShadow: '0 10px 24px rgba(107, 70, 193, 0.18)' }
        : { background: 'var(--c-surface-raised)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }
    }
  >
    {children}
  </button>
);

export const SearchInput = ({ value, onChange, placeholder = 'Search…', icon: Icon }) => (
  <div className="relative">
    {Icon ? <Icon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--c-text-3)' }} /> : null}
    <input value={value} onChange={onChange} placeholder={placeholder} className="input-base" style={{ paddingLeft: Icon ? 42 : undefined }} />
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="card p-10 text-center">
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl" style={{ background: 'var(--c-surface-raised)' }}>
      <Icon className="h-7 w-7" style={{ color: 'var(--c-text-3)' }} />
    </div>
    <h3 className="text-lg font-bold" style={{ color: 'var(--c-text-0)' }}>{title}</h3>
    {description ? <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: 'var(--c-text-3)' }}>{description}</p> : null}
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);

export const LoadingScreen = ({ height = 'calc(100vh - 120px)' }) => (
  <div className="flex items-center justify-center" style={{ height }}>
    <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-t-transparent" style={{ borderColor: 'var(--c-accent)', borderTopColor: 'transparent' }} />
  </div>
);

export const Modal = ({ open, title, subtitle, onClose, children, width = 'max-w-lg' }) => (
  <AnimatePresence>
    {open ? (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className={`fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[94vw] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[1.75rem] border ${width}`}
          style={{ background: 'var(--c-surface-strong)', borderColor: 'var(--c-border)', boxShadow: 'var(--shadow-xl)' }}
        >
          <div
            className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b px-5 py-4 backdrop-blur-xl lg:px-6"
            style={{ borderColor: 'var(--c-border-subtle)', background: 'color-mix(in srgb, var(--c-surface-strong) 88%, transparent)' }}
          >
            <div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--c-text-0)' }}>{title}</h3>
              {subtitle ? <p className="mt-1 text-sm" style={{ color: 'var(--c-text-3)' }}>{subtitle}</p> : null}
            </div>
            <button onClick={onClose} className="btn-ghost h-10 w-10 rounded-2xl p-0">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-5 lg:p-6">{children}</div>
        </motion.div>
      </>
    ) : null}
  </AnimatePresence>
);

export const ProgressBar = ({ value, tone = 'var(--c-accent)', height = 10 }) => (
  <div className="overflow-hidden rounded-full" style={{ background: 'var(--c-surface-sunken)', height }}>
    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: tone }} />
  </div>
);

export const AvatarStack = ({ items = [], limit = 4 }) => (
  <div className="flex -space-x-2">
    {items.slice(0, limit).map((item, index) => (
      <div
        key={item._id || index}
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold text-white"
        style={{ borderColor: 'var(--c-surface-strong)', background: index % 2 ? 'var(--c-accent-2)' : 'var(--c-accent)' }}
      >
        {(item.firstName || item.fullName || 'U')[0]}
      </div>
    ))}
    {items.length > limit ? (
      <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold" style={{ borderColor: 'var(--c-surface-strong)', background: 'var(--c-surface-raised)', color: 'var(--c-text-2)' }}>
        +{items.length - limit}
      </div>
    ) : null}
  </div>
);