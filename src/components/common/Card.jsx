/**
 * Card Component
 * Reusable card container with optional header and footer
 */

const Card = ({
  children,
  title,
  subtitle,
  footer,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden ${className}`}
      {...props}
    >
      {(title || subtitle) && (
        <div
          className={`px-6 py-4 border-b border-gray-200 ${headerClassName}`}
        >
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      )}
      
      <div className={`px-6 py-4 ${bodyClassName}`}>{children}</div>
      
      {footer && (
        <div
          className={`px-6 py-4 bg-gray-50 border-t border-gray-200 ${footerClassName}`}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
