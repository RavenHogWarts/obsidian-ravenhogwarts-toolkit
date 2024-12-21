import * as React from 'react';
import { Card } from '@/src/ui/components/Card';
import { Toggle } from '@/src/ui/components/Toggle';
import { useToolkitSettings } from '../../../manager/hooks/useToolkitSettings';
import { t } from '@/src/i18n/i18n';
import RavenHogwartsToolkitPlugin from '@/src/main';
import { Settings } from 'lucide-react';
import { useDeveloperMode } from '@/src/manager/hooks/useDeveloperMode';

interface ToolkitOverviewProps {
  plugin: RavenHogwartsToolkitPlugin;
  onNavigateToDetail: (moduleId: string) => void;
  onVersionClick: () => void;
}

export const ToolkitOverview: React.FC<ToolkitOverviewProps> = ({
  plugin,
  onNavigateToDetail,
  onVersionClick
}) => {
  const { toolkits, updateToolkit } = useToolkitSettings({ plugin, onNavigateToDetail });
  const { showHint, handleVersionClick } = useDeveloperMode({
    plugin,
    onActivated: onVersionClick
  });

  return (
    <div className="rht-toolkit-overview">
      <div className="rht-toolkit-header">
        <div className="rht-toolkit-header-left">
          <h2>{t('common.overview.title')}</h2>
          <p>{t('common.overview.description')}</p>
        </div>
        <div className="rht-toolkit-header-right">
          <span 
            className="rht-version-text"
            onClick={handleVersionClick}
          >
            Version: {plugin.settings.config.version}
          </span>
          {showHint && (
            <small style={{ marginLeft: '8px', opacity: 0.7 }}>
              Keep clicking...
            </small>
          )}
        </div>
      </div>
      <div className="rht-toolkit-grid">
        {toolkits.map(toolkit => (
          <Card 
            key={toolkit.id}
            className={toolkit.id}
            title={t(`toolkit.${toolkit.id}.title`)}
            icon={toolkit.icon}
            description={t(`toolkit.${toolkit.id}.description`)}
            actions={
              <>
                <Toggle
                  checked={toolkit.enabled}
                  onChange={(checked) => updateToolkit(toolkit.id, checked)}
                  aria-label={t('common.toggle_toolkit')}
                />
                <button
                  className="rht-toolkit-settings-btn"
                  onClick={() => onNavigateToDetail(toolkit.id)}
                  aria-label={t('common.settings')}
                >
                  <Settings size={16} />
                </button>
              </>
            }
          />
        ))}
      </div>
    </div>
  );
}
