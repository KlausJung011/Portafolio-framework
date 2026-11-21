"""Espera la VM nueva y registra sus claves de host por TOFU (ver docs)."""
import ipaddress
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import time

ip = str(ipaddress.IPv4Address(sys.argv[1]))
tmp = Path(os.environ["RUNNER_TEMP"])
for attempt in range(120):
    try:
        with socket.create_connection((ip, 22), timeout=5):
            pass
        result = subprocess.run(["ssh-keyscan", "-T", "5", "-t", "ed25519", ip], capture_output=True, text=True)
        if result.returncode == 0 and result.stdout.strip():
            break
    except OSError:
        pass
    time.sleep(5)
else:
    raise SystemExit("La VM no responde por SSH. Revisa CIDR, rutas y estado de OCI.")
ssh_dir = Path.home() / ".ssh"
ssh_dir.mkdir(mode=0o700, exist_ok=True)
with (ssh_dir / "known_hosts").open("a", encoding="utf-8") as file:
    file.write(result.stdout)
(tmp / "inventory.ini").write_text(f"[portfolio]\n{ip} ansible_user=ubuntu ansible_ssh_private_key_file={tmp / 'portfolio_ssh'}\n", encoding="utf-8")
path = tmp / "runtime.json"
runtime = json.loads(path.read_text(encoding="utf-8"))
runtime.update(public_ip=ip, ssh_cidrs=list(dict.fromkeys(filter(None, [os.environ["TF_VAR_runner_ssh_cidr"], os.getenv("TF_VAR_admin_ssh_cidr")]))))
path.write_text(json.dumps(runtime), encoding="utf-8")
print("Inventario preparado; primer registro de clave de host por TOFU")
