import * as React from 'react';
import { SettingItem } from '@/src/components/base/Setting/SettingItem';
import { t } from '@/src/i18n/i18n';
import { IFrontmatterSorterConfig } from '@/src/toolkit/frontmatterSorter/types/config';
import RavenHogwartsToolkitPlugin from '@/src/main';
import { useModuleConfig } from '@/src/core/hooks/useModuleConfig';
import { Toggle } from '@/src/components/base/Button/Toggle';
import { TagInput } from '@/src/components/base/Input/TagInput';
import { App } from 'obsidian';
import { useVaultSuggestions } from '@/src/core/hooks/useVaultSuggestions';

interface FrontmatterSorterSettingsProps {
  app: App;
  plugin: RavenHogwartsToolkitPlugin;
}

export const FrontmatterSorterSettings: React.FC<FrontmatterSorterSettingsProps> = ({
  app,
  plugin
}) => {
  const { config, updateConfig } = useModuleConfig<IFrontmatterSorterConfig>(plugin, 'frontmatterSorter');
  const { folderSuggestions, fileSuggestions, keySuggestions } = useVaultSuggestions(app);

  const handleUpdateConfig = async (updates: Partial<IFrontmatterSorterConfig>) => {
    try {
      await updateConfig(updates);
    } catch (err) {
      console.error('Failed to update config:', err);
    }
  };

  return (
    <div className="rht-toolkit-detail-settings">
      <SettingItem
        name={t('toolkit.frontmatterSorter.settings.sortOnSave.title')}
        desc={t('toolkit.frontmatterSorter.settings.sortOnSave.description')}
      >
        <Toggle
          checked={config.sortOnSave}
          onChange={(checked) => handleUpdateConfig({ sortOnSave: checked })}
        />
      </SettingItem>

      <SettingItem
        name={t('toolkit.frontmatterSorter.settings.ignoreFolders.title')}
        desc={t('toolkit.frontmatterSorter.settings.ignoreFolders.description')}
        collapsible={true}
        defaultCollapsed={true}
      >
        <TagInput 
          values={config.ignoreFolders || []}
          onChange={(values) => handleUpdateConfig({ ignoreFolders: values })}
          suggestions={folderSuggestions}
          placeholder={t('toolkit.frontmatterSorter.settings.ignoreFolders.placeholder')}
        />
      </SettingItem>

      <SettingItem
        name={t('toolkit.frontmatterSorter.settings.ignoreFiles.title')}
        desc={t('toolkit.frontmatterSorter.settings.ignoreFiles.description')}
        collapsible={true}
        defaultCollapsed={true}
      >
        <TagInput 
          values={config.ignoreFiles || []}
          onChange={(values) => handleUpdateConfig({ ignoreFiles: values })}
          suggestions={fileSuggestions}
          placeholder={t('toolkit.frontmatterSorter.settings.ignoreFiles.placeholder')}
        />
      </SettingItem>

      <h3>{t('toolkit.frontmatterSorter.settings.rules.title')}</h3>
      <SettingItem
        name={t('toolkit.frontmatterSorter.settings.rules.arraySort.title')}
        desc={t('toolkit.frontmatterSorter.settings.rules.arraySort.description')}
      >
        <Toggle
          checked={config.rules.arraySort}
          onChange={(checked) => handleUpdateConfig({ 
            rules: { ...config.rules, arraySort: checked }
          })}
        />
      </SettingItem>

      <SettingItem
        name={t('toolkit.frontmatterSorter.settings.rules.caseSensitive.title')}
        desc={t('toolkit.frontmatterSorter.settings.rules.caseSensitive.description')}
      >
        <Toggle
          checked={config.rules.caseSensitive}
          onChange={(checked) => handleUpdateConfig({ 
            rules: { ...config.rules, caseSensitive: checked }
          })}
        />
      </SettingItem>

      <SettingItem
        name={t('toolkit.frontmatterSorter.settings.rules.priority.title')}
        desc={t('toolkit.frontmatterSorter.settings.rules.priority.description')}
        collapsible={true}
        defaultCollapsed={true}
      >
        <TagInput 
          values={config.rules.priority || []}
          onChange={(values) => handleUpdateConfig({ rules: { ...config.rules, priority: values } })}
          suggestions={keySuggestions}
          placeholder={t('toolkit.frontmatterSorter.settings.rules.priority.placeholder')}
        />
      </SettingItem>

      <SettingItem
        name={t('toolkit.frontmatterSorter.settings.rules.ignoreKeys.title')}
        desc={t('toolkit.frontmatterSorter.settings.rules.ignoreKeys.description')}
        collapsible={true}
        defaultCollapsed={true}
      >
        <TagInput 
          values={config.rules.ignoreKeys || []}
          onChange={(values) => handleUpdateConfig({ rules: { ...config.rules, ignoreKeys: values } })}
          suggestions={keySuggestions}
          placeholder={t('toolkit.frontmatterSorter.settings.rules.ignoreKeys.placeholder')}
        />
      </SettingItem>
    </div>
  );
};

