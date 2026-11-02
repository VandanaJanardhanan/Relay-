import React from 'react';

export default function Card({
  title,
  subtitle,
  action,
  icon: Icon,
  children,
  className = '',
  bodyClassName = '',
  footer,
}) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      {(title || subtitle || action || Icon) && (
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              {title && <h3 className="font-semibold text-slate-900 text-base">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={`p-6 ${bodyClassName}`}>{children}</div>
      {footer && (
        <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 rounded-b-xl text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
}

