import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';

export const PageHeader = ({ eyebrow, title, description, actions, aside }) => (
  <section className="surface-card rounded-[1.75rem] p-5 lg:p-7">
    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="section-title mb-3">{eyebrow}</p> : null}
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1
              className="text-3xl font-black tracking-[-0.05em] lg:text-[2.5rem]"
              style={{ color: 'var(--c-text)', fontFamily: 'var(--font-display)' }}
            >
              {title}
            </h1>
            {description ? (
              <p className="mt-3 max-w-3xl text-sm leading-6 lg:text-[0.95rem]" style={{ color: 'var(--c-text-soft)' }}>
                {description}
              </p>
            ) : null}
          </div>
          {aside ? <div className="xl:pb-1">{aside}</div> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  </section>
);

export const StatCard = ({ label, value, icon: Icon, tone = 'var(--brand-primary)', helper, trend }) => (
  <section className="surface-card surface-card-hover rounded-[1.5rem] p-5">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="section-title mb-3">{label}</p>
        <p className="stat-value text-3xl lg:text-[2rem]" style={{ color: tone }}>
          {value}
        </p>
        {helper ? <p className="mt-2 text-sm" style={{ color: 'var(--c-text-soft)' }}>{helper}</p> : null}
      </div>
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
        style={{ background: tone === 'var(--brand-secondary)' ? 'var(--c-secondary-soft)' : 'var(--c-primary-soft)' }}
      >
        <Icon className="h-5 w-5" style={{ color: tone }} />
      </div>
    </div>
    {trend ? <div className="mt-4">{trend}</div> : null}
  </section>
);

export const Panel = ({ title, subtitle, action, children, className = '', bodyClassName = '' }) => (
  <section className={`surface-card rounded-[1.75rem] ${className}`}>
    {(title || subtitle || action) && (
      <div
        className="flex flex-col gap-3 border-b px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6"
        style={{ borderColor: 'var(--c-border)' }}
      >
        <div>
          {title ? <h2 className="text-base font-extrabold" style={{ color: 'var(--c-text)' }}>{title}</h2> : null}
          {subtitle ? <p className="mt-1 text-sm" style={{ color: 'var(--c-text-soft)' }}>{subtitle}</p> : null}
        </div>
        {action ? <div className="flex items-center gap-2">{action}</div> : null}
      </div>
    )}
    <div className={`p-5 lg:p-6 ${bodyClassName}`}>{children}</div>
  </section>
);

export const FilterChip = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-full border px-3.5 py-2 text-xs font-extrabold uppercase tracking-[0.08em] transition-all"
    style={
      active
        ? { background: 'var(--brand-primary)', borderColor: 'var(--brand-primary)', color: '#ffffff' }
        : { background: 'var(--c-surface)', borderColor: 'var(--c-border)', color: 'var(--c-text-soft)' }
    }
  >
    {children}
  </button>
);

export const SearchInput = ({ value, onChange, placeholder = 'Search', icon: Icon = Search }) => (
  <div className="relative w-full">
    <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--c-text-faint)' }} />
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="input-base"
      style={{ paddingLeft: 44 }}
    />
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <section className="surface-card rounded-[1.75rem] px-6 py-14 text-center">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem]" style={{ background: 'var(--c-surface-3)' }}>
      <Icon className="h-7 w-7" style={{ color: 'var(--brand-primary)' }} />
    </div>
    <h3 className="mt-5 text-xl font-black" style={{ color: 'var(--c-text)' }}>
      {title}
    </h3>
    {description ? <p className="mx-auto mt-2 max-w-lg text-sm leading-6" style={{ color: 'var(--c-text-soft)' }}>{description}</p> : null}
    {action ? <div className="mt-5">{action}</div> : null}
  </section>
);

export const LoadingScreen = ({ height = 'calc(100vh - 160px)' }) => (
  <div className="flex items-center justify-center" style={{ height }}>
    <div className="relative flex h-14 w-14 items-center justify-center rounded-full border-2" style={{ borderColor: 'var(--c-border)' }}>
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-t-transparent" style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }} />
    </div>
  </div>
);

export const Modal = ({ open, title, subtitle, onClose, children, width = 'max-w-lg' }) => (
  <AnimatePresence>
    {open ? (
      <>
        <motion.div
          className="fixed inset-0 z-50 bg-black/45"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className={`fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[94vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[1.8rem] border ${width}`}
          style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)', boxShadow: 'var(--shadow-lg)' }}
        >
          <div className="flex items-start justify-between gap-4 border-b px-5 py-4 lg:px-6" style={{ borderColor: 'var(--c-border)' }}>
            <div>
              <h3 className="text-lg font-black" style={{ color: 'var(--c-text)' }}>{title}</h3>
              {subtitle ? <p className="mt-1 text-sm" style={{ color: 'var(--c-text-soft)' }}>{subtitle}</p> : null}
            </div>
            <button type="button" onClick={onClose} className="btn-ghost h-10 w-10 rounded-2xl p-0" aria-label="Close dialog">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-[calc(88vh-78px)] overflow-y-auto p-5 lg:p-6">{children}</div>
        </motion.div>
      </>
    ) : null}
  </AnimatePresence>
);

export const ProgressBar = ({ value, tone = 'var(--brand-primary)', height = 10 }) => (
  <div className="overflow-hidden rounded-full" style={{ height, background: 'var(--c-surface-3)' }}>
    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, background: tone }} />
  </div>
);

export const AvatarStack = ({ items = [], limit = 4 }) => (
  <div className="flex -space-x-3">
    {items.slice(0, limit).map((item, index) => (
      <div
        key={item._id || index}
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-black text-white"
        style={{
          borderColor: 'var(--c-surface)',
          background: index % 2 === 0 ? 'var(--brand-primary)' : 'var(--brand-secondary)',
        }}
      >
        {(item.firstName || item.fullName || 'U')[0]}
      </div>
    ))}
    {items.length > limit ? (
      <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-black" style={{ borderColor: 'var(--c-surface)', background: 'var(--c-surface-3)', color: 'var(--c-text-soft)' }}>
        +{items.length - limit}
      </div>
    ) : null}
  </div>
);

export const SegmentedTabs = ({ items, value, onChange }) => (
  <div className="inline-flex rounded-full border p-1" style={{ borderColor: 'var(--c-border)', background: 'var(--c-surface-2)' }}>
    {items.map((item) => (
      <button
        key={item.value}
        type="button"
        onClick={() => onChange(item.value)}
        className="rounded-full px-3.5 py-2 text-xs font-extrabold uppercase tracking-[0.08em] transition-all"
        style={
          value === item.value
            ? { background: 'var(--brand-primary)', color: '#ffffff' }
            : { color: 'var(--c-text-soft)' }
        }
      >
        {item.label}
      </button>
    ))}
  </div>
);
