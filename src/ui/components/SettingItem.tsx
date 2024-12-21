import { ChevronDown, ChevronRight } from 'lucide-react';
import * as React from 'react';

interface SettingItemProps {
  name: string;
  desc?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export const SettingItem: React.FC<SettingItemProps> = ({ name, desc, icon, children, collapsible, defaultCollapsed }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  return (
    <div className={`rht-setting-item ${collapsible ? 'is-collapsible' : ''}`}>
      <div 
        className={"rht-setting-item-info"}
        // onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
      >
        <div className="rht-setting-item-heading">
          {icon && <span className="rht-setting-item-icon">{icon}</span>}
          <div 
            className="rht-setting-item-name" 
            onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
          >{name}</div>
          {collapsible && (
            <span 
              className="rht-setting-item-collapse-icon" 
              onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            </span>
          )}
        </div>
        {desc && <div className="rht-setting-item-description">{desc}</div>}
      </div>
      {children && !isCollapsed && (
        <div className="rht-setting-item-control">
          {children}
        </div>
      )}
    </div>
  );
}; 