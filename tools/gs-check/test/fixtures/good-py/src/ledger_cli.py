import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ledger import balance  # noqa: E402

print(balance([int(a) for a in sys.argv[1:]]))
