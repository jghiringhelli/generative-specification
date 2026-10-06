# Ledger library (python)

A tiny ledger library. It is a hand-built known-good control for the FX-1 conformance checker (python stack), not a real product.

## Clean clone

```bash
python -m pip install -r requirements.txt
python scripts/install_hooks.py
python -m pytest -q
python src/ledger_cli.py 3 -1 4
```
