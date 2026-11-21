"""Valida archivos YAML/JSON sin conectar a Oracle ni leer credenciales locales."""
import json
from pathlib import Path
import yaml

root = Path(__file__).resolve().parents[1]
for directory in (root / '.github/workflows', root / 'infra/ansible'):
    for path in directory.rglob('*.yml'):
        with path.open(encoding='utf-8') as file:
            yaml.safe_load(file)
        print('YAML correcto:', path.relative_to(root))
for name in ('compose.yml', 'compose.local.yml', 'compose.prod.yml'):
    yaml.safe_load((root / name).read_text(encoding='utf-8'))
    print('YAML correcto:', name)
json.loads((root / 'backend/app/seed.json').read_text(encoding='utf-8'))
print('JSON inicial correcto')
