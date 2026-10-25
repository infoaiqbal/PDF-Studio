import React from 'react';

export interface IconDefinition {
  prefix: string;
  iconName: string;
  icon: [number, number, string[], string, string | string[]];
}

interface FontAwesomeIconProps extends React.SVGProps<SVGSVGElement> {
  icon: IconDefinition | any;
  className?: string;
  title?: string;
}

/**
 * Pure SVG Renderer for FontAwesome icons compatible with React 19.
 * Extracts [width, height, ligatures, unicode, svgPathData] directly.
 */
export const FontAwesomeIcon: React.FC<FontAwesomeIconProps> = ({
  icon,
  className = '',
  title,
  ...props
}) => {
  if (!icon || !icon.icon) {
    return null;
  }

  const [width, height, , , pathData] = icon.icon;
  const paths = Array.isArray(pathData) ? pathData : [pathData];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      className={`inline-block fill-current shrink-0 align-[-0.125em] w-[1em] h-[1em] ${className}`}
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : 'presentation'}
      {...props}
    >
      {title && <title>{title}</title>}
      {paths.map((d, index) => (
        <path key={index} d={d} />
      ))}
    </svg>
  );
};
