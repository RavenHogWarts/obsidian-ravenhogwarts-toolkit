import * as React from 'react';
import RavenHogwartsToolkitPlugin from '@/src/main';
import { getStandardTime } from '@/src/lib/date';

interface UseDeveloperModeProps {
  plugin: RavenHogwartsToolkitPlugin;
  onActivated: () => void;
}

export const useDeveloperMode = ({ plugin, onActivated }: UseDeveloperModeProps) => {
  const [clickCount, setClickCount] = React.useState(0);
  const [showHint, setShowHint] = React.useState(false);
  const clickTimeout = React.useRef<NodeJS.Timeout>();
  const hasBeenEnabled = Boolean(plugin.settings.config.developer?.enableCount > 0);

  // 当组件卸载时禁用开发者模式
  React.useEffect(() => {
    return () => {
      if (plugin.settings.config.developer?.enabled) {
        plugin.updateSettings({
          config: {
            ...plugin.settings.config,
            developer: {
              ...plugin.settings.config.developer,
              enabled: false
            }
          }
        });
      }
    };
  }, [plugin]);

  const handleVersionClick = React.useCallback(() => {
    // 如果之前启用过，只需点击一次
    if (hasBeenEnabled) {
      plugin.updateSettings({
        config: {
          ...plugin.settings.config,
          developer: {
            enabled: true,
            lastEnabled: new Date().toISOString(),
            enableCount: plugin.settings.config.developer?.enabled ?  (plugin.settings.config.developer?.enableCount || 0) : (plugin.settings.config.developer?.enableCount || 0) + 1
          }
        }
      });
      onActivated();
      return;
    }

    // 首次启用需要点击7次
    setClickCount(prev => {
      const newCount = prev + 1;
        
      // 清除之前的超时
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current);
      }

      // 设置新的超时
      clickTimeout.current = setTimeout(() => {
        setClickCount(0);
        setShowHint(false);
      }, 1000);

      // 显示提示
      if (newCount >= 5) {
        setShowHint(true);
      }

      // 激活开发者模式
      if (newCount >= 7) {
        plugin.updateSettings({
          config: {
            ...plugin.settings.config,
            developer: {
              enabled: true,
              lastEnabled: getStandardTime(),
              enableCount: (plugin.settings.config.developer?.enableCount || 0) + 1
            }
          }
        });
        onActivated();
        return 0;
      }

      return newCount;
    });
  }, [plugin, onActivated, hasBeenEnabled]);

  return {
    showHint: showHint && !hasBeenEnabled,
    handleVersionClick
  };
}; 