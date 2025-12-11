#!/usr/bin/env python3
"""SSH Run Command Script - Executes commands on remote server via SSH"""

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


def ssh_run(command):
    """Execute a command on the remote server"""
    config = load_env()

    host = config.get('SSH_HOST')
    user = config.get('SSH_USER')
    password = config.get('SSH_PASSWORD')
    port = int(config.get('SSH_PORT', 22))

    if not all([host, user, password]):
        print("Error: Missing SSH configuration in .env file", file=sys.stderr)
        sys.exit(1)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        client.connect(host, port=port, username=user, password=password, timeout=30)
        stdin, stdout, stderr = client.exec_command(command)

        output = stdout.read().decode('utf-8', errors='replace')
        errors = stderr.read().decode('utf-8', errors='replace')
        exit_code = stdout.channel.recv_exit_status()

        if output:
            print(output.encode('ascii', errors='replace').decode('ascii'), end='')
        if errors:
            print(errors.encode('ascii', errors='replace').decode('ascii'), end='', file=sys.stderr)

        return exit_code

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
        client.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python ssh_run.py <command>", file=sys.stderr)
        sys.exit(1)

    command = ' '.join(sys.argv[1:])
    exit_code = ssh_run(command)
    sys.exit(exit_code)
