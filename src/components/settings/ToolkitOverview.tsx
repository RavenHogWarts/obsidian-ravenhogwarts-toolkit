import * as React from 'react';
import { Card } from '@/src/components/base/Card/Card';
import { Toggle } from '@/src/components/base/Button/Toggle';
import { useToolkitSettings } from '@/src/core/hooks/useToolkitSettings';
import { t } from '@/src/i18n/i18n';
import RavenHogwartsToolkitPlugin from '@/src/main';
import { Settings } from 'lucide-react';
import { useDeveloperMode } from '@/src/core/hooks/useDeveloperMode';
import { Logger } from '@/src/core/services/Log';
import { ToolkitId } from '@/src/core/interfaces/types';
import parse from 'html-react-parser';

interface ToolkitOverviewProps {
  plugin: RavenHogwartsToolkitPlugin;
  logger: Logger;
  onNavigateToDetail: (moduleId: string) => void;
  onVersionClick: () => void;
}

export const ToolkitOverview: React.FC<ToolkitOverviewProps> = ({
  plugin,
  logger,
  onNavigateToDetail,
  onVersionClick
}) => {
  const { toolkits, updateToolkit } = useToolkitSettings({ plugin, onNavigateToDetail });
  const { showHint, handleVersionClick } = useDeveloperMode({
    plugin,
    onActivated: onVersionClick
  });

  // 处理工具包启用/禁用
  const handleToolkitToggle = async (toolkitId: ToolkitId, enabled: boolean) => {
    try {
      const manager = plugin.getManager(toolkitId);
      if (!manager) {
        throw new Error(`Manager not found for toolkit: ${toolkitId}`);
      }

      if (enabled) {
        await manager.enable();
      } else {
        await manager.disable();
      }

      // 更新设置
      await updateToolkit(toolkitId, enabled);
      
    } catch (error) {
      logger.error(`Failed to ${enabled ? 'enable' : 'disable'} toolkit ${toolkitId}:`, error);
    }
  };

  return (
    <div className="rht-toolkit-overview">
      <div className="rht-toolkit-header">
        <div className="rht-toolkit-header-left">
          <h2>{t('common.overview.title')}</h2>
          <p>{parse(t('common.overview.description'))}</p>
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
                  onChange={(checked) => handleToolkitToggle(toolkit.id, checked)}
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
