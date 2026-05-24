/**
 * Service Content Renderer Component
 * Renders dynamic service content sections — matches admin preview exactly
 */

const ServiceContentRenderer = ({ sections }) => {
  if (!sections || sections.length === 0) return null;

  const headingStyles = {
    1: 'text-4xl font-extrabold tracking-tight text-gray-900 mb-5 leading-tight',
    2: 'text-3xl font-bold tracking-tight text-gray-900 mb-4 leading-snug',
    3: 'text-2xl font-semibold text-gray-800 mb-3',
    4: 'text-xl font-semibold text-gray-800 mb-2',
    5: 'text-lg font-medium text-gray-700 mb-2',
  };

  return (
    <div className="space-y-8 max-w-none">
      {sections.map((section, i) => {
        const key = `section-${i}`;

        switch (section.type) {
          case 'heading': {
            const Tag = `h${section.level || 1}`;
            const isH1 = (section.level || 1) === 1;
            const align = section.align || 'left';
            return (
              <div key={key} className={`text-${align}`}>
                {isH1 && <div className={`w-10 h-1 rounded-full bg-[#9333EA] mb-3 ${align === 'center' ? 'mx-auto' : align === 'right' ? 'ml-auto' : ''}`} />}
                <Tag className={headingStyles[section.level || 1]}>
                  {section.content}
                </Tag>
              </div>
            );
          }

          case 'paragraph':
            return (
              <p key={key} className={`text-gray-600 text-[1.05rem] leading-8 text-${section.align || 'left'}`}>
                {section.content}
              </p>
            );

          case 'span':
            return (
              <p key={key} className={`text-${section.align || 'left'}`}>
                <span className="inline-block px-3 py-1 bg-[#f5f0ff] text-[#9333EA] text-sm font-medium rounded-full">
                  {section.content}
                </span>
              </p>
            );

          case 'image':
            return section.url ? (
              <div
                key={key}
                className={`flex ${
                  section.position === 'center'
                    ? 'justify-center'
                    : section.position === 'right'
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                <img
                  src={section.url}
                  alt=""
                  className="max-w-full rounded-2xl shadow-lg ring-1 ring-black/5 object-cover"
                />
              </div>
            ) : null;

          case 'imageText': {
            const isLeft = section.position !== 'right';
            return (
              <div
                key={key}
                className={`flex flex-col md:flex-row items-center gap-8 ${
                  isLeft ? '' : 'md:flex-row-reverse'
                }`}
              >
                <div className="w-full md:w-1/2 flex-shrink-0">
                  {section.imageUrl ? (
                    <img
                      src={section.imageUrl}
                      alt=""
                      className="w-full rounded-2xl shadow-lg ring-1 ring-black/5 object-cover"
                    />
                  ) : null}
                </div>
                <p className="flex-1 text-gray-600 text-[1.05rem] leading-8">
                  {section.text}
                </p>
              </div>
            );
          }

          case 'portfolio':
            return (
              <div
                key={key}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {(section.items || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-44 object-cover"
                      />
                    ) : (
                      <div className="w-full h-44 bg-gradient-to-br from-[#f5f0ff] to-[#ede9fe]" />
                    )}
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            );

          case 'list':
            return (
              <ul key={key} className="space-y-2.5">
                {(section.items || []).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-[#9333EA] flex-shrink-0" />
                    <span className="text-gray-600 text-[1.05rem] leading-7">{item}</span>
                  </li>
                ))}
              </ul>
            );

          case 'quote':
            return (
              <div key={key} className="relative pl-6">
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b from-[#9333EA] to-[#c084fc]" />
                <p className="text-gray-500 text-lg italic leading-8 font-light">
                  {section.content}
                </p>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};

export default ServiceContentRenderer;
