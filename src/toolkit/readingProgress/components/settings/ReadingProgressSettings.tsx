import * as React from 'react';
import RavenHogwartsToolkitPlugin from "@/src/main";
import { IReadingProgressConfig } from "@/src/toolkit/readingProgress/types/config";
import { useModuleConfig } from "@/src/core/hooks/useModuleConfig";
import { SettingItem } from '@/src/components/base/Setting/SettingItem';
import { Toggle } from '@/src/components/base/Button/Toggle';
import { t } from '@/src/i18n/i18n';

interface ReadingProgressSettingsProps {
  plugin: RavenHogwartsToolkitPlugin;
}

export const ReadingProgressSettings: React.FC<ReadingProgressSettingsProps> = ({ plugin }) => {
  const { config, updateConfig } = useModuleConfig<IReadingProgressConfig>(plugin, 'readingProgress');

  const handleUpdateConfig = async (updates: Partial<IReadingProgressConfig>) => {
    try {
      await updateConfig(updates);
    } catch (err) {
      console.error('Failed to update config:', err);
    }
  };

  return(
    <div className="rht-toolkit-detail-settings">
      <SettingItem
        name={t('toolkit.readingProgress.settings.position.title')}
        desc={t('toolkit.readingProgress.settings.position.description')}
      >
        <select 
          value={config.position}
          onChange={(e) => handleUpdateConfig({ position: e.target.value as 'left' | 'right' })}
        >
          <option value="left">{t('toolkit.readingProgress.settings.position.left')}</option>
          <option value="right">{t('toolkit.readingProgress.settings.position.right')}</option>
        </select>
      </SettingItem>

      <SettingItem
        name={t('toolkit.readingProgress.settings.offset.title')}
        desc={t('toolkit.readingProgress.settings.offset.description')}
      >
        <input
          type="number"
          value={config.offset}
          onChange={(e) => handleUpdateConfig({ offset: parseInt(e.target.value) })}
        />
      </SettingItem>

      <SettingItem
        name={t('toolkit.readingProgress.settings.showTOC.title')}
        desc={t('toolkit.readingProgress.settings.showTOC.description')}
      >
        <Toggle
          checked={config.showTOC}
          onChange={(checked) => handleUpdateConfig({ showTOC: checked })}
        />
      </SettingItem>

      {config.showTOC && (
        <>
          <SettingItem
              name={t('toolkit.readingProgress.settings.tocAlwaysExpanded.title')}
              desc={t('toolkit.readingProgress.settings.tocAlwaysExpanded.description')}
          >
            <Toggle
              checked={config.tocAlwaysExpanded}
              onChange={(checked) => handleUpdateConfig({ tocAlwaysExpanded: checked })}
            />
          </SettingItem>

          <SettingItem
            name={t('toolkit.readingProgress.settings.tocWidth.title')}
            desc={t('toolkit.readingProgress.settings.tocWidth.description')}
          >
            <input
              type="number"
              value={config.tocWidth}
              onChange={(e) => handleUpdateConfig({ tocWidth: parseInt(e.target.value) })}
            />
          </SettingItem>
        </>
      )}

      <SettingItem
        name={t('toolkit.readingProgress.settings.showProgress.title')}
        desc={t('toolkit.readingProgress.settings.showProgress.description')}
      >
        <Toggle
          checked={config.showProgress}
          onChange={(checked) => handleUpdateConfig({ showProgress: checked })}
        />
      </SettingItem>

      <SettingItem
        name={t('toolkit.readingProgress.settings.showReadingTime.title')}
        desc={t('toolkit.readingProgress.settings.showReadingTime.description')}
      >
        <Toggle
          checked={config.showReadingTime}
          onChange={(checked) => handleUpdateConfig({ showReadingTime: checked })}
        />
      </SettingItem>
    </div>
  );

}