import {
  List,
  ActionPanel,
  Action,
  Form,
  showToast,
  Toast,
  getSelectedFinderItems,
} from "@raycast/api";
import React, { useState, useEffect } from "react";
import { parseSSHConfig } from "./utils/sshConfig";
import { executeScp } from "./utils/scp";
import { validateLocalPath, validateRemotePath, validateHostConfig } from "./utils/validation";
import { SSHHostConfig, TransferDirection, TransferOptions } from "./types/server";

/**
 * Main upload command component
 * Displays list of SSH hosts from config file
 */
export default function Command() {
  const [hosts, setHosts] = useState<SSHHostConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHosts();
  }, []);

  async function loadHosts() {
    try {
      const parsedHosts = parseSSHConfig();
      
      if (parsedHosts.length === 0) {
        setError("No host entries found in SSH config file");
      } else {
        setHosts(parsedHosts);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to parse SSH config";
      setError(errorMessage);
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (error) {
    return (
      <List>
        <List.EmptyView
          title="Error Loading SSH Config"
          description={error}
        />
      </List>
    );
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search hosts...">
      {hosts.map((host) => (
        <List.Item
          key={host.host}
          title={host.host}
          subtitle={host.hostName}
          accessories={[
            { text: host.user ? `User: ${host.user}` : "" },
            { text: host.port ? `Port: ${host.port}` : "" },
          ]}
          actions={
            <ActionPanel>
              <Action.Push
                title="Select Files to Upload"
                target={<FileSelectionView hostConfig={host} />}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

/**
 * File selection view
 * Allows user to select local files to upload
 */
function FileSelectionView({ hostConfig }: { hostConfig: SSHHostConfig }) {
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [isSelecting, setIsSelecting] = useState(false);

  async function selectFiles() {
    setIsSelecting(true);
    try {
      // Try to get selected Finder items first
      const finderItems = await getSelectedFinderItems();
      
      if (finderItems.length > 0) {
        // Use the first selected item
        setSelectedPath(finderItems[0].path);
      } else {
        // Fall back to file picker
        await showToast({
          style: Toast.Style.Animated,
          title: "Opening file picker...",
        });
        // Note: open() doesn't return the selected path, so we'll use a form instead
        setSelectedPath(""); // Reset and show form
      }
    } catch (err) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: "Failed to select files",
      });
    } finally {
      setIsSelecting(false);
    }
  }

  useEffect(() => {
    selectFiles();
  }, []);

  return (
    <Form
      isLoading={isSelecting}
      actions={
        <ActionPanel>
          <Action.Push
            title="Continue"
            target={<RemotePathForm hostConfig={hostConfig} localPath={selectedPath} />}
          />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="localPath"
        title="Local Path"
        placeholder="/path/to/local/file"
        value={selectedPath}
        onChange={setSelectedPath}
        info="Enter the path to the file or directory you want to upload"
      />
      <Form.Description
        title="Host Details"
        text={`Uploading to: ${hostConfig.host}${hostConfig.hostName ? ` (${hostConfig.hostName})` : ""}`}
      />
      {hostConfig.user && (
        <Form.Description title="User" text={hostConfig.user} />
      )}
      {hostConfig.port && (
        <Form.Description title="Port" text={hostConfig.port.toString()} />
      )}
      {hostConfig.identityFile && (
        <Form.Description title="Identity File" text={hostConfig.identityFile} />
      )}
    </Form>
  );
}

/**
 * Remote path input form
 * Allows user to specify destination path on remote server
 */
function RemotePathForm({
  hostConfig,
  localPath,
}: {
  hostConfig: SSHHostConfig;
  localPath: string;
}) {
  const [remotePath, setRemotePath] = useState<string>("");
  const [remotePathError, setRemotePathError] = useState<string | undefined>();

  async function handleSubmit(values: { remotePath: string }) {
    const remotePathValue = values.remotePath.trim();

    // Validate local path
    const localValidation = validateLocalPath(localPath);
    if (!localValidation.valid) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Local Path",
        message: localValidation.error,
      });
      return;
    }

    // Validate remote path
    const remoteValidation = validateRemotePath(remotePathValue);
    if (!remoteValidation.valid) {
      setRemotePathError(remoteValidation.error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Remote Path",
        message: remoteValidation.error,
      });
      return;
    }

    // Validate host config
    const hostValidation = validateHostConfig(hostConfig);
    if (!hostValidation.valid) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Host Configuration",
        message: hostValidation.error,
      });
      return;
    }

    // Execute transfer
    await executeTransfer(hostConfig, localPath, remotePathValue);
  }

  async function executeTransfer(
    hostConfig: SSHHostConfig,
    localPath: string,
    remotePath: string
  ) {
    // Show progress toast
    await showToast({
      style: Toast.Style.Animated,
      title: "Transferring files...",
    });

    try {
      const options: TransferOptions = {
        hostConfig,
        localPath,
        remotePath,
        direction: TransferDirection.UPLOAD,
      };

      const result = await executeScp(options);

      if (result.success) {
        await showToast({
          style: Toast.Style.Success,
          title: "Transfer completed successfully",
        });
      } else {
        await showToast({
          style: Toast.Style.Failure,
          title: "Transfer failed",
          message: result.message,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      await showToast({
        style: Toast.Style.Failure,
        title: "Transfer failed",
        message: errorMessage,
      });
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Upload" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="remotePath"
        title="Remote Path"
        placeholder="/path/to/remote/destination"
        value={remotePath}
        onChange={(value) => {
          setRemotePath(value);
          setRemotePathError(undefined);
        }}
        error={remotePathError}
        info="Enter the destination path on the remote server"
      />
      <Form.Description
        title="Local Path"
        text={localPath}
      />
      <Form.Description
        title="Host"
        text={`${hostConfig.host}${hostConfig.hostName ? ` (${hostConfig.hostName})` : ""}`}
      />
    </Form>
  );
}
