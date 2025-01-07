export interface IReadingProgressConfig {
  enabled: boolean;
  showTOC: boolean;
  showProgress: boolean;
  showReadingTime: boolean;
  position: 'left' | 'right';
}

export interface IReadingProgressData {
  lastModified: string;
}

export const READING_PROGRESS_DEFAULT_CONFIG: IReadingProgressConfig = {
  enabled: true,
  showTOC: true,
  showProgress: true,
  showReadingTime: true,
  position: 'right',
}

