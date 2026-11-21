"""Prepara secretos del runner sin imprimir sus valores."""
import json
import os
from pathlib import Path
import re
import subprocess


def required(name):
    value = os.environ.get(name, "").strip()
    if not value:
        raise SystemExit(f"Falta configurar {name} en GitHub")
    return value


def private_file(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    path.chmod(0o600)


if __name__ == "__main__":
    for name in ("TF_VAR_compartment_ocid", "TF_VAR_availability_domain", "TF_VAR_ubuntu_2404_image_ocid", "TF_VAR_ssh_public_key", "POSTGRES_PASSWORD", "ADMIN_PASSWORD", "DOCKER_TOKEN"):
        required(name)
    tmp = Path(required("RUNNER_TEMP"))
    for name in ("POSTGRES_PASSWORD", "ADMIN_PASSWORD"):
        if not re.fullmatch(r"[A-Za-z0-9]{24,128}", required(name)) or required(name).startswith("REPLACE_"):
            raise SystemExit(f"{name} debe tener 24 a 128 caracteres alfanuméricos nuevos")
    for name, pattern in (("ADMIN_USERNAME", r"[A-Za-z0-9_-]{1,80}"), ("DOCKER_USERNAME", r"[a-z0-9_-]+")):
        if not re.fullmatch(pattern, required(name)):
            raise SystemExit(f"Formato inválido en {name}")
    oci_dir = Path.home() / ".oci"
    key = oci_dir / "oci_api_key.pem"
    private_file(key, required("OCI_API_KEY_PEM").replace("\r\n", "\n") + "\n")
    config = "[DEFAULT]\n" + "\n".join(f"{key_name}={required(env)}" for key_name, env in [("tenancy", "OCI_TENANCY_OCID"), ("user", "OCI_USER_OCID"), ("fingerprint", "OCI_FINGERPRINT"), ("region", "OCI_REGION")]) + f"\nkey_file={key}\n"
    private_file(oci_dir / "config", config)
    backend = {"bucket": required("OCI_STATE_BUCKET"), "namespace": required("OCI_NAMESPACE"), "key": "portafolio/production.tfstate", "region": required("OCI_REGION"), "config_file_profile": "DEFAULT"}
    private_file(tmp / "backend.hcl", "\n".join(f"{k} = {json.dumps(v)}" for k, v in backend.items()) + "\n")
    ssh_key = tmp / "portfolio_ssh"
    private_file(ssh_key, required("SSH_PRIVATE_KEY").replace("\r\n", "\n") + "\n")
    derived = subprocess.run(["ssh-keygen", "-y", "-P", "", "-f", str(ssh_key)], capture_output=True, text=True)
    if derived.returncode != 0 or derived.stdout.split()[:2] != required("TF_VAR_ssh_public_key").split()[:2]:
        raise SystemExit("Las claves SSH no corresponden o la privada está cifrada. Revisa SSH_PRIVATE_KEY y SSH_PUBLIC_KEY.")
    runtime = {name.lower(): required(name) for name in ("POSTGRES_PASSWORD", "ADMIN_USERNAME", "ADMIN_PASSWORD", "DOCKER_USERNAME", "DOCKER_TOKEN", "IMAGE_TAG")}
    private_file(tmp / "runtime.json", json.dumps(runtime))
    print("Credenciales y variables preparadas sin mostrar valores")
