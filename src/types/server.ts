/**
 * SSH host configuration parsed from ~/.ssh/config
 */
export interface SSHHostConfig {
  host: string; // Host alias from config
  hostName?: string; // Actual hostname or IP
  user?: string; // SSH username
  port?: number; // SSH port (default 22)
  identityFile?: string; // Path to SSH key
  proxyJump?: string; // Jump host configuration
}

/**
 * Direction of file transfer
 */
export enum TransferDirection {
  UPLOAD = "upload",
  DOWNLOAD = "download",
}

/**
 * Options for rsync transfer operation
 */
export interface TransferOptions {
  hostConfig: SSHHostConfig;
  localPath: string;
  remotePath: string;
  direction: TransferDirection;
}

/**
 * Result of rsync command execution
 */
export interface RsyncResult {
  success: boolean;
  message: string;
  stderr?: string;
}

/**
 * Remote file information from ls command
 */
export interface RemoteFile {
  name: string;
  isDirectory: boolean;
  size?: string;
  permissions?: string;
  modifiedDate?: string;
}
