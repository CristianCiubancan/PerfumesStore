#!/usr/bin/env python3
"""SCP Run Script - Copies files to remote server via SFTP"""

import sys
import os
from pathlib import Path

import paramiko


def load_env():
    """Load environment variables from .env file"""
    env_path = Path(__file__).parent / ".env"

    if not env_path.exists():
        print(f"Error: .env file not found at {env_path}", file=sys.stderr)
        sys.exit(1)

    config = {}
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                config[key.strip()] = value.strip()

    return config


def scp_copy(local_path, remote_path):
    """Copy file or directory to remote server"""
    config = load_env()

    host = config.get('SSH_HOST')
    user = config.get('SSH_USER')
    password = config.get('SSH_PASSWORD')
    port = int(config.get('SSH_PORT', 22))

    if not all([host, user, password]):
        print("Error: Missing SSH configuration in .env file", file=sys.stderr)
        sys.exit(1)

    local = Path(local_path)
    if not local.exists():
        print(f"Error: Local path not found: {local_path}", file=sys.stderr)
        sys.exit(1)

    print(f"Connecting to {host}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        ssh.connect(host, port=port, username=user, password=password, timeout=30)
        sftp = ssh.open_sftp()

        if local.is_file():
            # Single file upload
            print(f"Uploading {local.name}...")
            sftp.put(str(local), remote_path)
            print(f"Done! Uploaded {local.name}")
        else:
            # Directory upload
            files = list(local.glob('*'))
            files = [f for f in files if f.is_file()]

            if not files:
                print("No files found to upload.")
                return 0

            # Ensure remote dir exists
            try:
                sftp.mkdir(remote_path)
            except IOError:
                pass  # Directory already exists

            print(f"Uploading {len(files)} files...")

            for i, f in enumerate(files):
                remote_file = f'{remote_path}/{f.name}'
                sftp.put(str(f), remote_file)
                if (i + 1) % 10 == 0 or (i + 1) == len(files):
                    print(f"Uploaded {i + 1}/{len(files)}")

            print(f"Done! Uploaded {len(files)} files.")

        sftp.close()
        return 0

    except paramiko.AuthenticationException:
        print("Error: Authentication failed", file=sys.stderr)
        return 1
    except paramiko.SSHException as e:
        print(f"Error: SSH connection failed - {e}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1
    finally:
        ssh.close()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python scp_run.py <local_path> <remote_path>", file=sys.stderr)
        print("\nExamples:", file=sys.stderr)
        print("  python scp_run.py ../server/uploads/products /root/PerfumesStore/server/uploads/products", file=sys.stderr)
        print("  python scp_run.py ./file.txt /root/file.txt", file=sys.stderr)
        sys.exit(1)

    local_path = sys.argv[1]
    remote_path = sys.argv[2]

    exit_code = scp_copy(local_path, remote_path)
    sys.exit(exit_code)
