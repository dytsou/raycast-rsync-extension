import { exec } from 'child_process';
import { promisify } from 'util';
import { homedir } from 'os';
import { join } from 'path';
import { TransferOptions, TransferDirection, ScpResult } from '../types/server';

const execAsync = promisify(exec);

/**
 * Builds an SCP command string based on transfer options
 * @param options - Transfer options including direction, paths, and host config
 * @returns The constructed SCP command string
 */
export function buildScpCommand(options: TransferOptions): string {
  const { hostConfig, localPath, remotePath, direction } = options;
  const configPath = join(homedir(), '.ssh', 'config');
  const hostAlias = hostConfig.host;

  // Base command with config file reference and recursive flag
  const baseCommand = `scp -F ${configPath} -r`;

  if (direction === TransferDirection.UPLOAD) {
    // Upload: scp -F ~/.ssh/config -r {localPath} {hostAlias}:{remotePath}
    return `${baseCommand} ${localPath} ${hostAlias}:${remotePath}`;
  } else {
    // Download: scp -F ~/.ssh/config -r {hostAlias}:{remotePath} {localPath}
    return `${baseCommand} ${hostAlias}:${remotePath} ${localPath}`;
  }
}

/**
 * Executes an SCP command and returns the result
 * @param options - Transfer options including direction, paths, and host config
 * @returns Promise resolving to ScpResult with success status and message
 */
export async function executeScp(options: TransferOptions): Promise<ScpResult> {
  const command = buildScpCommand(options);

  try {
    // Execute with 5 minute timeout (300000 ms)
    const { stdout, stderr } = await execAsync(command, {
      timeout: 300000,
    });

    // Success if no error thrown
    return {
      success: true,
      message: 'Transfer completed successfully',
      stderr: stderr || undefined,
    };
  } catch (error: any) {
    // Handle execution errors
    const errorMessage = error.message || 'Unknown error occurred';
    const stderr = error.stderr || '';

    return {
      success: false,
      message: `Transfer failed: ${errorMessage}`,
      stderr: stderr || undefined,
    };
  }
}
