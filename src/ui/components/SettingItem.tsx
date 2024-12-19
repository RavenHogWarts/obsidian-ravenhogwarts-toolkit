import * as React from 'react';

interface SettingItemProps {
  name: string;
  desc?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const SettingItem: React.FC<SettingItemProps> = ({ name, desc, icon, children }) => {
  return (
    <div className="rht-setting-item">
      <div className="rht-setting-item-info">
        <div className="rht-setting-item-heading">
          {icon && <span className="rht-setting-item-icon">{icon}</span>}
          <div className="rht-setting-item-name">{name}</div>
        </div>
        {desc && <div className="rht-setting-item-description">{desc}</div>}
      </div>
      {children && (
        <div className="rht-setting-item-control">
          {children}
        </div>
      )}
    </div>
  );
}; 