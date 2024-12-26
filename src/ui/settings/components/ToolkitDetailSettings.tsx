import * as React from 'react';
import { t } from '@/src/i18n/i18n';
import RavenHogwartsToolkitPlugin from '@/src/main';
import { QuickPathSettings } from '@/src/toolkit/quickPath/ui/QuickPathSettings';
import { FrontmatterSorterSettings } from '@/src/toolkit/frontmatterSorter/ui/FrontmatterSorterSettings';
import { TableEnhancementsSettings } from '@/src/toolkit/tableEnhancements/ui/TableEnhancementsSettings';
import { ToolkitId } from '../../../manager/types';
import { ArrowLeft } from 'lucide-react';
import { App } from 'obsidian';

interface ToolkitDetailSettingsProps {
  app: App;
  plugin: RavenHogwartsToolkitPlugin;
  moduleId: ToolkitId;
  onNavigateBack: () => void;
}

export const ToolkitDetailSettings: React.FC<ToolkitDetailSettingsProps> = ({
  app,
  plugin,
  moduleId,
  onNavigateBack
}) => {
  const renderModuleSettings = () => {
    switch (moduleId) {
      case 'quickPath':
        return <QuickPathSettings plugin={plugin} />;
      case 'tableEnhancements':
        return <TableEnhancementsSettings />;
      case 'frontmatterSorter':
        return <FrontmatterSorterSettings app={app} plugin={plugin} />;
      case 'obReader':
      case 'customIcons':
      default:
        return null;
    }
  };

  return (
    <div className="rht-toolkit-detail">
      <div className="rht-toolkit-detail-header">
        <button 
          className="rht-back-button"
          onClick={onNavigateBack}
          aria-label={t('common.back')}
        >
          <ArrowLeft size={16} />
          {t('common.back')}
        </button>
        <h2>{t(`toolkit.${moduleId}.title`)}</h2>
      </div>
      <div className="rht-toolkit-detail-content">
        {renderModuleSettings()}
      </div>
    </div>
  );
}
