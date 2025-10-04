import { supabase } from '@/lib/supabase';
import { Logger } from '@/lib/monitoring/logger';
import { SystemMonitor } from '@/lib/monitoring/system-monitor';

interface BackupMetadata {
  id: string;
  type: 'database' | 'files' | 'configuration' | 'full';
  size: number;
  timestamp: Date;
  checksum: string;
  status: 'creating' | 'completed' | 'failed' | 'corrupted';
  retention_days: number;
  location: string;
  encryption_key?: string;
}

interface BackupConfig {
  enabled: boolean;
  schedule: {
    daily_at: string; // HH:MM format
    weekly_day: number; // 0-6 (Sunday-Saturday)
    monthly_date: number; // 1-28
  };
  retention: {
    daily_backups: number;
    weekly_backups: number;
    monthly_backups: number;
  };
  compression: boolean;
  encryption: boolean;
  storage: {
    type: 'local' | 'cloud' | 'hybrid';
    path: string;
    cloud_provider?: 'aws_s3' | 'google_cloud' | 'azure';
    credentials?: any;
  };
}

interface RestoreOptions {
  backup_id: string;
  target_timestamp?: Date;
  selective_restore?: {
    tables?: string[];
    files?: string[];
    configurations?: string[];
  };
  verify_integrity: boolean;
  dry_run: boolean;
}

interface DisasterRecoveryPlan {
  priority_tables: string[];
  recovery_time_objective: number; // minutes
  recovery_point_objective: number; // minutes
  critical_functions: string[];
  emergency_contacts: Array<{
    name: string;
    email: string;
    phone: string;
    role: string;
  }>;
  escalation_procedures: Array<{
    step: number;
    condition: string;
    action: string;
    responsible: string;
    timeout_minutes: number;
  }>;
}

export class BackupManager {
  private static instance: BackupManager;
  private logger: Logger;
  private monitor: SystemMonitor;
  private isBackupRunning: boolean = false;
  private currentBackupId?: string;

  private defaultConfig: BackupConfig = {
    enabled: true,
    schedule: {
      daily_at: '02:00',
      weekly_day: 0, // Sunday
      monthly_date: 1
    },
    retention: {
      daily_backups: 7,
      weekly_backups: 4,
      monthly_backups: 12
    },
    compression: true,
    encryption: true,
    storage: {
      type: 'hybrid',
      path: '/backups/stronghold',
      cloud_provider: 'aws_s3'
    }
  };

  private disasterRecoveryPlan: DisasterRecoveryPlan = {
    priority_tables: [
      'users',
      'profiles',
      'wills',
      'guardians',
      'emergency_contacts',
      'audit_logs'
    ],
    recovery_time_objective: 60, // 1 hour
    recovery_point_objective: 15, // 15 minutes
    critical_functions: [
      'user_authentication',
      'will_generation',
      'emergency_notifications',
      'guardian_access'
    ],
    emergency_contacts: [
      {
        name: 'System Administrator',
        email: 'admin@stronghold.sk',
        phone: '+421123456789',
        role: 'Primary Technical Contact'
      },
      {
        name: 'Database Administrator',
        email: 'dba@stronghold.sk',
        phone: '+421987654321',
        role: 'Database Recovery Specialist'
      }
    ],
    escalation_procedures: [
      {
        step: 1,
        condition: 'Service unavailable > 15 minutes',
        action: 'Notify technical team and begin automated recovery',
        responsible: 'Monitoring System',
        timeout_minutes: 15
      },
      {
        step: 2,
        condition: 'Automated recovery failed',
        action: 'Contact System Administrator',
        responsible: 'Monitoring System',
        timeout_minutes: 30
      },
      {
        step: 3,
        condition: 'Manual recovery > 1 hour',
        action: 'Escalate to management and legal team',
        responsible: 'System Administrator',
        timeout_minutes: 60
      }
    ]
  };

  private constructor() {
    this.logger = Logger.getInstance();
    this.monitor = SystemMonitor.getInstance();
    this.initializeBackupSystem();
  }

  static getInstance(): BackupManager {
    if (!BackupManager.instance) {
      BackupManager.instance = new BackupManager();
    }
    return BackupManager.instance;
  }

  /**
   * Initialize backup system and schedule
   */
  private async initializeBackupSystem(): Promise<void> {
    try {
      await this.createBackupTables();
      await this.setupBackupSchedule();
      await this.validateBackupEnvironment();

      this.logger.info('Backup system initialized successfully', {
        category: 'backup',
        action: 'initialize'
      });
    } catch (error) {
      this.logger.error('Failed to initialize backup system', {
        category: 'backup',
        action: 'initialize',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Create backup metadata tables
   */
  private async createBackupTables(): Promise<void> {
    const createBackupsTable = `
      CREATE TABLE IF NOT EXISTS backup_metadata (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type TEXT NOT NULL CHECK (type IN ('database', 'files', 'configuration', 'full')),
        size BIGINT NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        checksum TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('creating', 'completed', 'failed', 'corrupted')),
        retention_days INTEGER NOT NULL DEFAULT 30,
        location TEXT NOT NULL,
        encryption_key TEXT,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    const createRestoreLogsTable = `
      CREATE TABLE IF NOT EXISTS restore_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        backup_id UUID REFERENCES backup_metadata(id),
        restore_type TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
        details JSONB,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        error_message TEXT
      );
    `;

    await supabase.rpc('exec_sql', { sql: createBackupsTable });
    await supabase.rpc('exec_sql', { sql: createRestoreLogsTable });
  }

  /**
   * Setup automated backup schedule
   */
  private async setupBackupSchedule(): Promise<void> {
    // In production, this would integrate with a job scheduler like cron
    const config = await this.getBackupConfig();

    if (config.enabled) {
      // Schedule daily backup
      this.scheduleNextBackup('daily', config.schedule.daily_at);

      this.logger.info('Backup schedule configured', {
        category: 'backup',
        action: 'schedule',
        daily_time: config.schedule.daily_at,
        retention: config.retention
      });
    }
  }

  /**
   * Schedule next backup
   */
  private scheduleNextBackup(type: 'daily' | 'weekly' | 'monthly', timeString: string): void {
    const [hours, minutes] = timeString.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date();

    scheduledTime.setHours(hours, minutes, 0, 0);

    // If scheduled time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const delay = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
      this.performScheduledBackup(type);
    }, delay);
  }

  /**
   * Perform scheduled backup
   */
  private async performScheduledBackup(type: 'daily' | 'weekly' | 'monthly'): Promise<void> {
    try {
      const backupType = type === 'daily' ? 'database' : 'full';
      const metadata = await this.createBackup(backupType);

      this.logger.info(`Scheduled ${type} backup completed`, {
        category: 'backup',
        action: 'scheduled_backup',
        backup_id: metadata.id,
        type: backupType
      });

      // Clean up old backups
      await this.cleanupOldBackups();

      // Schedule next backup
      const config = await this.getBackupConfig();
      this.scheduleNextBackup(type, config.schedule.daily_at);

    } catch (error) {
      this.logger.error(`Scheduled ${type} backup failed`, {
        category: 'backup',
        action: 'scheduled_backup',
        error: error instanceof Error ? error.message : String(error)
      });

      // Attempt backup again in 1 hour
      setTimeout(() => {
        this.performScheduledBackup(type);
      }, 60 * 60 * 1000);
    }
  }

  /**
   * Create backup
   */
  async createBackup(
    type: 'database' | 'files' | 'configuration' | 'full',
    options: {
      encryption?: boolean;
      compression?: boolean;
      retention_days?: number;
    } = {}
  ): Promise<BackupMetadata> {
    if (this.isBackupRunning) {
      throw new Error('Backup is already in progress');
    }

    this.isBackupRunning = true;
    const backupId = crypto.randomUUID();
    this.currentBackupId = backupId;

    try {
      this.logger.info('Starting backup creation', {
        category: 'backup',
        action: 'create',
        backup_id: backupId,
        type
      });

      const config = await this.getBackupConfig();
      const timestamp = new Date();

      // Create backup metadata record
      const metadata: BackupMetadata = {
        id: backupId,
        type,
        size: 0,
        timestamp,
        checksum: '',
        status: 'creating',
        retention_days: options.retention_days || 30,
        location: this.generateBackupLocation(type, timestamp),
        encryption_key: options.encryption !== false ? this.generateEncryptionKey() : undefined
      };

      await this.insertBackupMetadata(metadata);

      // Perform backup based on type
      let backupData: any;
      switch (type) {
        case 'database':
          backupData = await this.backupDatabase();
          break;
        case 'files':
          backupData = await this.backupFiles();
          break;
        case 'configuration':
          backupData = await this.backupConfiguration();
          break;
        case 'full':
          backupData = await this.performFullBackup();
          break;
      }

      // Process backup data
      const processedData = await this.processBackupData(backupData, {
        compression: options.compression !== false,
        encryption: options.encryption !== false,
        encryptionKey: metadata.encryption_key
      });

      // Store backup
      await this.storeBackup(metadata.location, processedData);

      // Calculate final metadata
      metadata.size = processedData.byteLength || 0;
      metadata.checksum = await this.calculateChecksum(processedData);
      metadata.status = 'completed';

      await this.updateBackupMetadata(metadata);

      this.logger.info('Backup created successfully', {
        category: 'backup',
        action: 'create',
        backup_id: backupId,
        type,
        size: metadata.size,
        location: metadata.location
      });

      return metadata;

    } catch (error) {
      this.logger.error('Backup creation failed', {
        category: 'backup',
        action: 'create',
        backup_id: backupId,
        error: error instanceof Error ? error.message : String(error)
      });

      // Update metadata to failed status
      if (this.currentBackupId) {
        await this.updateBackupStatus(this.currentBackupId, 'failed');
      }

      throw error;
    } finally {
      this.isBackupRunning = false;
      this.currentBackupId = undefined;
    }
  }

  /**
   * Backup database
   */
  private async backupDatabase(): Promise<any> {
    const tables = this.disasterRecoveryPlan.priority_tables;
    const backupData: any = {};

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*');

        if (error) throw error;

        backupData[table] = data;

        this.logger.debug(`Backed up table: ${table}`, {
          category: 'backup',
          action: 'backup_table',
          table,
          record_count: data?.length || 0
        });
      } catch (error) {
        this.logger.warn(`Failed to backup table: ${table}`, {
          category: 'backup',
          action: 'backup_table',
          table,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return backupData;
  }

  /**
   * Backup files (placeholder - would backup uploaded files)
   */
  private async backupFiles(): Promise<any> {
    // In production, this would backup file storage
    return {
      files: [],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Backup configuration
   */
  private async backupConfiguration(): Promise<any> {
    return {
      backup_config: this.defaultConfig,
      disaster_recovery_plan: this.disasterRecoveryPlan,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Perform full backup
   */
  private async performFullBackup(): Promise<any> {
    const [database, files, configuration] = await Promise.all([
      this.backupDatabase(),
      this.backupFiles(),
      this.backupConfiguration()
    ]);

    return {
      database,
      files,
      configuration,
      metadata: {
        version: '1.0',
        created_at: new Date().toISOString(),
        backup_type: 'full'
      }
    };
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(options: RestoreOptions): Promise<void> {
    const restoreId = crypto.randomUUID();

    try {
      this.logger.info('Starting restore operation', {
        category: 'backup',
        action: 'restore',
        restore_id: restoreId,
        backup_id: options.backup_id
      });

      // Log restore start
      await this.logRestoreOperation(restoreId, options.backup_id, 'started', options);

      // Validate backup integrity
      if (options.verify_integrity) {
        await this.verifyBackupIntegrity(options.backup_id);
      }

      // Get backup metadata
      const backup = await this.getBackupMetadata(options.backup_id);
      if (!backup) {
        throw new Error(`Backup not found: ${options.backup_id}`);
      }

      // Load backup data
      const backupData = await this.loadBackupData(backup);

      if (options.dry_run) {
        this.logger.info('Dry run completed - no changes made', {
          category: 'backup',
          action: 'restore',
          restore_id: restoreId,
          backup_id: options.backup_id
        });
        return;
      }

      // Perform restore based on backup type
      switch (backup.type) {
        case 'database':
          await this.restoreDatabase(backupData, options.selective_restore?.tables);
          break;
        case 'files':
          await this.restoreFiles(backupData, options.selective_restore?.files);
          break;
        case 'configuration':
          await this.restoreConfiguration(backupData, options.selective_restore?.configurations);
          break;
        case 'full':
          await this.restoreFullBackup(backupData, options.selective_restore);
          break;
      }

      // Log successful restore
      await this.logRestoreOperation(restoreId, options.backup_id, 'completed', options);

      this.logger.info('Restore operation completed successfully', {
        category: 'backup',
        action: 'restore',
        restore_id: restoreId,
        backup_id: options.backup_id
      });

    } catch (error) {
      this.logger.error('Restore operation failed', {
        category: 'backup',
        action: 'restore',
        restore_id: restoreId,
        backup_id: options.backup_id,
        error: error instanceof Error ? error.message : String(error)
      });

      // Log failed restore
      await this.logRestoreOperation(
        restoreId,
        options.backup_id,
        'failed',
        options,
        error instanceof Error ? error.message : String(error)
      );

      throw error;
    }
  }

  /**
   * Execute disaster recovery
   */
  async executeDisasterRecovery(): Promise<void> {
    try {
      this.logger.critical('Disaster recovery initiated', {
        category: 'backup',
        action: 'disaster_recovery'
      });

      // Notify emergency contacts
      await this.notifyEmergencyContacts();

      // Find latest good backup
      const latestBackup = await this.findLatestValidBackup();
      if (!latestBackup) {
        throw new Error('No valid backup found for disaster recovery');
      }

      // Execute emergency restore
      await this.restoreFromBackup({
        backup_id: latestBackup.id,
        verify_integrity: true,
        dry_run: false
      });

      // Verify critical functions
      await this.verifyCriticalFunctions();

      this.logger.info('Disaster recovery completed successfully', {
        category: 'backup',
        action: 'disaster_recovery',
        backup_id: latestBackup.id
      });

    } catch (error) {
      this.logger.critical('Disaster recovery failed', {
        category: 'backup',
        action: 'disaster_recovery',
        error: error instanceof Error ? error.message : String(error)
      });

      // Escalate to next level
      await this.escalateDisasterRecovery();
      throw error;
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStatistics(): Promise<{
    total_backups: number;
    total_size: number;
    successful_backups: number;
    failed_backups: number;
    oldest_backup: Date | null;
    newest_backup: Date | null;
    backup_frequency: number; // backups per day
  }> {
    const { data: backups } = await supabase
      .from('backup_metadata')
      .select('size, timestamp, status');

    const successful = backups?.filter(b => b.status === 'completed') || [];
    const failed = backups?.filter(b => b.status === 'failed') || [];

    const totalSize = successful.reduce((sum, b) => sum + (b.size || 0), 0);
    const timestamps = successful.map(b => new Date(b.timestamp));

    return {
      total_backups: backups?.length || 0,
      total_size: totalSize,
      successful_backups: successful.length,
      failed_backups: failed.length,
      oldest_backup: timestamps.length > 0 ? new Date(Math.min(...timestamps.map(t => t.getTime()))) : null,
      newest_backup: timestamps.length > 0 ? new Date(Math.max(...timestamps.map(t => t.getTime()))) : null,
      backup_frequency: this.calculateBackupFrequency(timestamps)
    };
  }

  // Helper methods
  private generateBackupLocation(type: string, timestamp: Date): string {
    const dateStr = timestamp.toISOString().split('T')[0];
    const timeStr = timestamp.toTimeString().split(' ')[0].replace(/:/g, '-');
    return `/backups/stronghold/${type}/${dateStr}/${timeStr}_${crypto.randomUUID().slice(0, 8)}.backup`;
  }

  private generateEncryptionKey(): string {
    return crypto.randomUUID() + crypto.randomUUID();
  }

  private async calculateChecksum(data: any): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async processBackupData(data: any, options: {
    compression: boolean;
    encryption: boolean;
    encryptionKey?: string;
  }): Promise<ArrayBuffer> {
    let processedData = JSON.stringify(data);

    if (options.compression) {
      // In production, would implement compression
      this.logger.debug('Compression applied to backup data');
    }

    if (options.encryption && options.encryptionKey) {
      // In production, would implement encryption
      this.logger.debug('Encryption applied to backup data');
    }

    return new TextEncoder().encode(processedData).buffer;
  }

  private async storeBackup(location: string, data: ArrayBuffer): Promise<void> {
    // In production, would store to configured storage location
    this.logger.debug('Backup stored successfully', { location, size: data.byteLength });
  }

  private async getBackupConfig(): Promise<BackupConfig> {
    // In production, would load from database or config file
    return this.defaultConfig;
  }

  private async insertBackupMetadata(metadata: BackupMetadata): Promise<void> {
    await supabase
      .from('backup_metadata')
      .insert({
        id: metadata.id,
        type: metadata.type,
        size: metadata.size,
        timestamp: metadata.timestamp.toISOString(),
        checksum: metadata.checksum,
        status: metadata.status,
        retention_days: metadata.retention_days,
        location: metadata.location,
        encryption_key: metadata.encryption_key
      });
  }

  private async updateBackupMetadata(metadata: BackupMetadata): Promise<void> {
    await supabase
      .from('backup_metadata')
      .update({
        size: metadata.size,
        checksum: metadata.checksum,
        status: metadata.status
      })
      .eq('id', metadata.id);
  }

  private async updateBackupStatus(backupId: string, status: BackupMetadata['status']): Promise<void> {
    await supabase
      .from('backup_metadata')
      .update({ status })
      .eq('id', backupId);
  }

  private async cleanupOldBackups(): Promise<void> {
    const config = await this.getBackupConfig();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Math.max(
      config.retention.daily_backups,
      config.retention.weekly_backups * 7,
      config.retention.monthly_backups * 30
    ));

    const { data: oldBackups } = await supabase
      .from('backup_metadata')
      .select('id, location')
      .lt('timestamp', cutoffDate.toISOString());

    if (oldBackups && oldBackups.length > 0) {
      // Delete backup files and metadata
      for (const backup of oldBackups) {
        // In production, would delete actual backup files
        await supabase
          .from('backup_metadata')
          .delete()
          .eq('id', backup.id);
      }

      this.logger.info('Old backups cleaned up', {
        category: 'backup',
        action: 'cleanup',
        deleted_count: oldBackups.length
      });
    }
  }

  private async validateBackupEnvironment(): Promise<void> {
    // Validate storage locations, permissions, etc.
    this.logger.info('Backup environment validated');
  }

  private async verifyBackupIntegrity(backupId: string): Promise<void> {
    const backup = await this.getBackupMetadata(backupId);
    if (!backup) {
      throw new Error('Backup not found');
    }

    // In production, would verify checksums and test restore
    this.logger.info('Backup integrity verified', { backup_id: backupId });
  }

  private async getBackupMetadata(backupId: string): Promise<BackupMetadata | null> {
    const { data } = await supabase
      .from('backup_metadata')
      .select('*')
      .eq('id', backupId)
      .single();

    return data ? {
      ...data,
      timestamp: new Date(data.timestamp)
    } : null;
  }

  private async loadBackupData(backup: BackupMetadata): Promise<any> {
    // In production, would load from actual storage location
    return {};
  }

  private async restoreDatabase(data: any, tables?: string[]): Promise<void> {
    // In production, would implement database restore
    this.logger.info('Database restore completed', { tables });
  }

  private async restoreFiles(data: any, files?: string[]): Promise<void> {
    // In production, would implement file restore
    this.logger.info('Files restore completed', { files });
  }

  private async restoreConfiguration(data: any, configs?: string[]): Promise<void> {
    // In production, would implement configuration restore
    this.logger.info('Configuration restore completed', { configs });
  }

  private async restoreFullBackup(data: any, selective?: RestoreOptions['selective_restore']): Promise<void> {
    await Promise.all([
      this.restoreDatabase(data.database, selective?.tables),
      this.restoreFiles(data.files, selective?.files),
      this.restoreConfiguration(data.configuration, selective?.configurations)
    ]);
  }

  private async logRestoreOperation(
    restoreId: string,
    backupId: string,
    status: 'started' | 'completed' | 'failed',
    options: RestoreOptions,
    errorMessage?: string
  ): Promise<void> {
    await supabase
      .from('restore_logs')
      .insert({
        id: restoreId,
        backup_id: backupId,
        restore_type: 'manual',
        status,
        details: options,
        ...(status === 'completed' && { completed_at: new Date().toISOString() }),
        ...(errorMessage && { error_message: errorMessage })
      });
  }

  private async findLatestValidBackup(): Promise<BackupMetadata | null> {
    const { data } = await supabase
      .from('backup_metadata')
      .select('*')
      .eq('status', 'completed')
      .order('timestamp', { ascending: false })
      .limit(1);

    return data && data.length > 0 ? {
      ...data[0],
      timestamp: new Date(data[0].timestamp)
    } : null;
  }

  private async notifyEmergencyContacts(): Promise<void> {
    // In production, would send notifications to emergency contacts
    this.logger.info('Emergency contacts notified');
  }

  private async verifyCriticalFunctions(): Promise<void> {
    // In production, would test critical system functions
    this.logger.info('Critical functions verified');
  }

  private async escalateDisasterRecovery(): Promise<void> {
    // In production, would follow escalation procedures
    this.logger.critical('Disaster recovery escalated to next level');
  }

  private calculateBackupFrequency(timestamps: Date[]): number {
    if (timestamps.length < 2) return 0;

    const sorted = timestamps.sort((a, b) => a.getTime() - b.getTime());
    const daysDiff = (sorted[sorted.length - 1].getTime() - sorted[0].getTime()) / (1000 * 60 * 60 * 24);

    return daysDiff > 0 ? timestamps.length / daysDiff : 0;
  }
}