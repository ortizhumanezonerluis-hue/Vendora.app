import { forwardRef, SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, className = '', children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={[
              'w-full h-9 pl-3 pr-8 text-[13px] bg-white border border-gray-200 rounded-lg',
              'text-gray-900 font-medium',
              'appearance-none cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300',
              'hover:border-gray-300',
              'transition-all duration-100',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50',
              className
            ].join(' ')}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            size={13}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
        {hint && (
          <p className="text-[11px] text-gray-400 mt-1">{hint}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Select }
