import { useCallback, useEffect, useState } from 'react';
import RavenHogwartsToolkitPlugin from '@/src/main';
import { t } from '@/src/i18n/i18n';
import { LucideIcon } from 'lucide-react';
import { TOOLKIT_CONFIG, ToolkitId } from '../types';

export interface ToolkitInfo {
  id: ToolkitId;
  icon: LucideIcon;
  enabled: boolean;
  title: string;
  description: string;
  openSettings: () => void;
}

interface UseToolkitSettingsReturn {
  toolkits: ToolkitInfo[];
  updateToolkit: (id: ToolkitId, enabled: boolean) => Promise<void>;
  loading: boolean;
  error: Error | null;
  refreshToolkits: () => void;
}

export const useToolkitSettings = ({
  plugin,
  onNavigateToDetail
}: {
  plugin: RavenHogwartsToolkitPlugin,
  onNavigateToDetail: (moduleId: ToolkitId) => void;
}): UseToolkitSettingsReturn => {
  const [toolkits, setToolkits] = useState<ToolkitInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 初始化工具包列表
  const initializeToolkits = useCallback(() => {
    try {
      const toolkitList = Object.entries(TOOLKIT_CONFIG)
        .map(([id, config]) => {
          const toolkitId = id as ToolkitId;
          const manager = plugin.getManager(toolkitId);
          return {
            id: toolkitId,
            icon: config.icon,
            enabled: manager?.isEnabled() ?? false,
            title: t(`toolkit.${toolkitId}.title`),
            description: t(`toolkit.${toolkitId}.description`),
            openSettings: () => onNavigateToDetail(toolkitId)
          };
        })
        .sort((a, b) => a.id.localeCompare(b.id));
      setToolkits(toolkitList);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to initialize toolkits'));
    } finally {
      setLoading(false);
    }
  }, [plugin]);

  useEffect(() => {
    initializeToolkits();
  }, [initializeToolkits]);
    

  const updateToolkit = useCallback(async (id: ToolkitId, enabled: boolean) => {
    try {
      const manager = plugin.getManager(id);
      if (manager) {
        if (enabled) {
          await manager.enable();
        } else {
          await manager.disable();
        }
        setToolkits(prev => 
          prev.map(t => 
            t.id === id ? { ...t, enabled } : t
          )
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update toolkit'));
    }
  }, [plugin]);

  const refreshToolkits = useCallback(() => {
    initializeToolkits();
  }, [initializeToolkits]);

  return { toolkits, updateToolkit, loading, error, refreshToolkits };
}; 