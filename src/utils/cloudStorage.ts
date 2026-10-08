import { VideoProject } from '../types';

export interface CloudBackupItem {
  id: string;
  projectId: string;
  projectName: string;
  timestamp: string;
  thumbnailUrl?: string;
  projectData: VideoProject;
  sizeKb: number;
}

const STORAGE_KEY = 'cliptrim_cloud_backups_v1';

export function getStoredBackups(): CloudBackupItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CloudBackupItem[];
  } catch (err) {
    console.error('Failed to load cloud backups', err);
    return [];
  }
}

export function saveProjectToCloud(project: VideoProject, thumbnailUrl?: string): CloudBackupItem {
  const backups = getStoredBackups();
  const serialized = JSON.stringify(project);
  const sizeKb = Math.round((serialized.length * 2) / 1024);

  const backupItem: CloudBackupItem = {
    id: `backup_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    projectId: project.id,
    projectName: project.name,
    timestamp: new Date().toISOString(),
    thumbnailUrl,
    projectData: project,
    sizeKb,
  };

  // Keep up to 25 latest backups
  const updated = [backupItem, ...backups.slice(0, 24)];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return backupItem;
}

export function deleteCloudBackup(backupId: string): void {
  const backups = getStoredBackups();
  const filtered = backups.filter((b) => b.id !== backupId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function exportBackupToFile(backupItem: CloudBackupItem): void {
  const jsonStr = JSON.stringify(backupItem, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ClipTrim_Backup_${backupItem.projectName.replace(/\s+/g, '_')}_${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function parseBackupFile(fileContent: string): CloudBackupItem {
  const parsed = JSON.parse(fileContent);
  if (!parsed.projectData || typeof parsed.projectData.trimStart !== 'number') {
    throw new Error('Invalid ClipTrim backup archive format');
  }
  return parsed as CloudBackupItem;
}
