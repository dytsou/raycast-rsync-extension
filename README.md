# Raycast SCP Extension

A Raycast extension for transferring files between local and remote servers using SCP with SSH config integration.

## Features

- Upload files from local system to remote servers
- Download files from remote servers to local system
- Automatic SSH config parsing from ~/.ssh/config
- Support for recursive directory transfers
- User-friendly interface with searchable host list

## Installation

1. Clone this repository
2. Run `pnpm install` to install dependencies
3. Run `pnpm run dev` to start development mode

## Usage

### Upload Files
1. Open Raycast and search for "Upload Files via SCP"
2. Select a host from your SSH config
3. Choose local files to upload
4. Enter the remote destination path
5. Confirm to start the transfer

### Download Files
1. Open Raycast and search for "Download Files via SCP"
2. Select a host from your SSH config
3. Enter the remote file path
4. Choose local destination directory
5. Confirm to start the transfer

## Requirements

- SSH config file at ~/.ssh/config with configured hosts
- SSH access to remote servers
- Raycast installed

## Development

```bash
# Install dependencies
pnpm install

# Start development mode
pnpm run dev

# Build for production
pnpm run build

# Lint code
pnpm run lint

# Fix linting issues
pnpm run fix-lint
```

## License

MIT
