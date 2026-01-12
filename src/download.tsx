import {
  List,
  ActionPanel,
  Action,
  Form,
  showToast,
  Toast,
} from "@raycast/api";
import React, { useState, useEffect } from "react";
import { parseSSHConfig } from "./utils/sshConfig";
import { executeScp } from "./utils/scp";
import { validateRemotePath, validateHostConfig } from "./utils/validation";
import { SSHHostConfig, TransferDirection, TransferOptions } from "./types/server";

/**
 * Main download command component
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
                title="Enter Remote Path"
                target={<RemotePathForm hostConfig={host} />}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

/**
 * Remote path input form
 * Allows user to specify source path on remote server
 */
function RemotePathForm({ hostConfig }: { hostConfig: SSHHostConfig }) {
  const [remotePath, setRemotePath] = useState<string>("");
  const [remotePathError, setRemotePathError] = useState<string | undefined>();

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.Push
            title="Continue"
            target={<LocalPathForm hostConfig={hostConfig} remotePath={remotePath} />}
          />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="remotePath"
        title="Remote Path"
        placeholder="/path/to/remote/file"
        value={remotePath}
        onChange={(value) => {
          setRemotePath(value);
          setRemotePathError(undefined);
        }}
        error={remotePathError}
        info="Enter the path to the file or directory on the remote server"
      />
      <Form.Description
        title="Host Details"
        text={`Downloading from: ${hostConfig.host}${hostConfig.hostName ? ` (${hostConfig.hostName})` : ""}`}
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
 * Local destination path form
 * Allows user to specify destination directory on local system
 */
function LocalPathForm({
  hostConfig,
  remotePath,
}: {
  hostConfig: SSHHostConfig;
  remotePath: string;
}) {
  const [localPath, setLocalPath] = useState<string>("");
  const [localPathError, setLocalPathError] = useState<string | undefined>();

  async function handleSubmit(values: { localPath: string }) {
    const localPathValue = values.localPath.trim();

    if (!localPathValue) {
      setLocalPathError("Local path is required");
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Local Path",
        message: "Local path is required",
      });
      return;
    }

    // Validate remote path
    const remoteValidation = validateRemotePath(remotePath);
    if (!remoteValidation.valid) {
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
    await executeTransfer(hostConfig, remotePath, localPathValue);
  }

  async function executeTransfer(
    hostConfig: SSHHostConfig,
    remotePath: string,
    localPath: string
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
        direction: TransferDirection.DOWNLOAD,
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
          <Action.SubmitForm title="Download" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="localPath"
        title="Local Destination Path"
        placeholder="/path/to/local/destination"
        value={localPath}
        onChange={(value) => {
          setLocalPath(value);
          setLocalPathError(undefined);
        }}
        error={localPathError}
        info="Enter the destination directory on your local system"
      />
      <Form.Description
        title="Remote Path"
        text={remotePath}
      />
      <Form.Description
        title="Host"
        text={`${hostConfig.host}${hostConfig.hostName ? ` (${hostConfig.hostName})` : ""}`}
      />
    </Form>
  );
}
