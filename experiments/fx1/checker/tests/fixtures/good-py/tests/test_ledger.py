# @gs AC-001 docs/spec/SPEC.md#acceptance-criteria
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src"))
from ledger import balance, largest_debit  # noqa: E402


def test_ac_001_balance_of_3_minus1_4_is_6():
    assert balance([3, -1, 4]) == 6


def test_ac_002_balance_of_empty_list_is_0():
    assert balance([]) == 0


def test_ac_003_non_integer_entry_raises_type_error():
    with pytest.raises(TypeError):
        balance([1.5])


def test_ac_004_largest_debit_of_3_minus1_minus5_is_5():
    assert largest_debit([3, -1, -5]) == 5


def test_ac_005_largest_debit_without_debits_is_0():
    assert largest_debit([1, 2]) == 0


def test_ac_001_balance_is_order_independent():
    assert balance([4, 3, -1]) == 6
