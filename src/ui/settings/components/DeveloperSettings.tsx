import * as React from 'react';
import RavenHogwartsToolkitPlugin from '@/src/main';
import { Logger, LogLevel } from '@/src/util/log';
import { SettingItem } from '../../components/SettingItem';
import { t } from '@/src/i18n/i18n';
import { Toggle } from '../../components/Toggle';

interface DeveloperSettingsProps {
  plugin: RavenHogwartsToolkitPlugin;
  logger: Logger;
}

export const DeveloperSettings: React.FC<DeveloperSettingsProps> = ({ plugin, logger }) => {
  const [loggerConfig, setLoggerConfig] = React.useState(plugin.settings.config.logger);

  // 监听插件设置变化
  React.useEffect(() => {
    setLoggerConfig(plugin.settings.config.logger);
  }, [plugin.settings.config.logger]);
  
  const handleSettingChange = async (
    key: keyof typeof loggerConfig,
    value: any
  ) => {
    // 创建新的配置对象
    const newConfig = {
      ...loggerConfig,
      [key]: value
    };
    try {
      setLoggerConfig(newConfig);
      await plugin.updateSettings({
        config: {
          ...plugin.settings.config,
          logger: newConfig
        }
      });
      Logger.initRootLogger(newConfig);
    } catch (error) {
      logger.error('Failed to update logger settings:', error);
    }
  };

  return (
    <div className="rht-toolkit-developer">
      <div className="rht-toolkit-developer-settings-header">
        <h2>{t('common.developer.title')}</h2>
        <p>{t('common.developer.description')}</p>
      </div>
      <div className="rht-toolkit-developer-settings-content">
        <div className='rht-toolkit-developer-settings'>
          <SettingItem 
            name={t('common.developer.logger.level')}
          >
            <select
              value={loggerConfig.level}
              onChange={(e) => handleSettingChange('level', Number(e.target.value) as LogLevel)}
            >
              {Object.entries(LogLevel)
                .filter(([key, value]) => typeof value === 'number')
                .map(([key, value]) => (
                  <option key={value} value={value}>
                    {key}
                  </option>
                ))}
            </select>
          </SettingItem>
          <SettingItem 
            name={t('common.developer.logger.showTimestamp')}
          >
            <Toggle
              checked={loggerConfig.showTimestamp}
              onChange={(checked: boolean) => handleSettingChange('showTimestamp', checked)}
            />
          </SettingItem>
          <SettingItem 
            name={t('common.developer.logger.showLevel')}
          >
            <Toggle
              checked={loggerConfig.showLevel}
              onChange={(checked: boolean) => handleSettingChange('showLevel', checked)}
            />
          </SettingItem>
          <SettingItem 
            name={t('common.developer.logger.console')}
          >
            <Toggle
              checked={loggerConfig.console}
              onChange={(checked: boolean) => handleSettingChange('console', checked)}
            />
          </SettingItem>
          <SettingItem 
            name={t('common.developer.logger.showNotifications')}
          >
            <Toggle
              checked={loggerConfig.showNotifications}
              onChange={(checked: boolean) => handleSettingChange('showNotifications', checked)}
            />
          </SettingItem>
          <SettingItem 
            name={t('common.developer.logger.noticeTimeout')}
          >
            <input type="number" value={loggerConfig.noticeTimeout} onChange={(e) => handleSettingChange('noticeTimeout', Number(e.target.value))} />
          </SettingItem>
        </div>
        
      </div>
    </div>
  );
}; 