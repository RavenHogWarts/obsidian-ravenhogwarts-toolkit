export interface IReadingProgressConfig {
  enabled: boolean;
  showTOC: boolean;
  tocAlwaysExpanded: boolean;
  showProgress: boolean;
  showReadingTime: boolean;
  position: 'left' | 'right';
  offset: number;
  tocWidth: number;
}

export interface IReadingProgressData {
  lastModified: string;
}

export const READING_PROGRESS_DEFAULT_CONFIG: IReadingProgressConfig = {
  enabled: true,
  showTOC: true,
  tocAlwaysExpanded: false,
  showProgress: true,
  showReadingTime: true,
  position: 'right',
  offset: 12,
  tocWidth: 240,
}

