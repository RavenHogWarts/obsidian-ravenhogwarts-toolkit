import * as React from 'react';
import { SettingItem } from '@/src/ui/components/SettingItem';
import { t } from '@/src/i18n/i18n';
import { IFrontmatterSorterConfig } from '../types/config';
import RavenHogwartsToolkitPlugin from '@/src/main';
import { useModuleConfig } from '@/src/manager/hooks/useModuleConfig';
import { Toggle } from '@/src/ui/components/Toggle';
import { TagInput } from '@/src/ui/components/TagInput';
import { App } from 'obsidian';
import { useVaultSuggestions } from '@/src/manager/hooks/useVaultSuggestions';

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
        />
      </SettingItem>

      <SettingItem
        name={t('toolkit.frontmatterSorter.settings.rules.customOrder.title')}
        desc={t('toolkit.frontmatterSorter.settings.rules.customOrder.description')}
        collapsible={true}
        defaultCollapsed={true}
      >
      </SettingItem>
    </div>
  );
};

