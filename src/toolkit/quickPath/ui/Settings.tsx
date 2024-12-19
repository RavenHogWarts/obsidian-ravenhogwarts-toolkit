import * as React from 'react';
import { SettingItem } from '@/src/ui/components/SettingItem';
import { t } from '@/src/i18n/i18n';
import { IQuickPathConfig } from '../types/config';
import RavenHogwartsToolkitPlugin from '@/src/main';
import { useModuleConfig } from '@/src/manager/hooks/useModuleConfig';
import { FileText, Split } from 'lucide-react';
import { Toggle } from '@/src/ui/components/Toggle';

interface QuickPathSettingsProps {
  plugin: RavenHogwartsToolkitPlugin;
}

export const QuickPathSettings: React.FC<QuickPathSettingsProps> = ({ plugin }) => {
  const { config, updateConfig } = useModuleConfig<IQuickPathConfig>(plugin, 'quickPath');

  const handleUpdateConfig = async (updates: Partial<IQuickPathConfig>) => {
    try {
      await updateConfig(updates);
    } catch (err) {
      console.error('Failed to update config:', err);
    }
  };

  return (
    <div className="quick-path-settings">
      <SettingItem
        name={t('toolkit.quickPath.settings.absolutePath.title')}
        desc={t('toolkit.quickPath.settings.absolutePath.description')}
        icon={<FileText size={18} />}
      >
        <Toggle
          checked={config.useAbsolutePath}
          onChange={(checked) => handleUpdateConfig({ useAbsolutePath: checked })}
        />
      </SettingItem>

      <SettingItem
        name={t('toolkit.quickPath.settings.separator.title')}
        desc={t('toolkit.quickPath.settings.separator.description')}
        icon={<Split size={18} />}
      >
        <select 
          value={config.pathSeparator}
          onChange={(e) => handleUpdateConfig({ pathSeparator: e.target.value })}
        >
          <option value="\n">{t('toolkit.quickPath.settings.separator.newline')}</option>
          <option value=", ">{t('toolkit.quickPath.settings.separator.comma')}</option>
          <option value="; ">{t('toolkit.quickPath.settings.separator.semicolon')}</option>
          <option value=" ">{t('toolkit.quickPath.settings.separator.space')}</option>
        </select>
      </SettingItem>
    </div>
  );
};

