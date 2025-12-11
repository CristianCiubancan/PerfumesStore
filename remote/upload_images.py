#!/usr/bin/env python3
"""Upload product images to remote server via SFTP"""

import sys
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


def upload_images():
    """Upload all product images to remote server"""
    config = load_env()

    host = config.get('SSH_HOST')
    user = config.get('SSH_USER')
    password = config.get('SSH_PASSWORD')
    port = int(config.get('SSH_PORT', 22))

    if not all([host, user, password]):
        print("Error: Missing SSH configuration in .env file", file=sys.stderr)
        sys.exit(1)

    # Paths
    local_dir = Path(__file__).parent.parent / "server" / "uploads" / "products"
    remote_dir = "/root/PerfumesStore/server/uploads/products"

    if not local_dir.exists():
        print(f"Error: Local directory not found: {local_dir}", file=sys.stderr)
        sys.exit(1)

    # Connect
    print(f"Connecting to {host}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        ssh.connect(host, port=port, username=user, password=password, timeout=30)
        sftp = ssh.open_sftp()

        # Ensure remote dir exists
        try:
            sftp.mkdir(remote_dir)
        except IOError:
            pass  # Directory already exists

        # Get list of image files
        files = list(local_dir.glob('*.png')) + list(local_dir.glob('*.jpg')) + list(local_dir.glob('*.webp'))

        if not files:
            print("No image files found to upload.")
            return

        print(f"Uploading {len(files)} images...")

        for i, f in enumerate(files):
            remote_path = f'{remote_dir}/{f.name}'
            sftp.put(str(f), remote_path)
            if (i + 1) % 10 == 0 or (i + 1) == len(files):
                print(f"Uploaded {i + 1}/{len(files)}")

        print(f"Done! Uploaded {len(files)} images.")
        sftp.close()

    except paramiko.AuthenticationException:
        print("Error: Authentication failed", file=sys.stderr)
        sys.exit(1)
    except paramiko.SSHException as e:
        print(f"Error: SSH connection failed - {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        ssh.close()


if __name__ == "__main__":
    upload_images()
