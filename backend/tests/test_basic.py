"""
Simple Test to verify pytest is working
"""
import pytest


def test_pytest_working():
    """Test that pytest is working correctly"""
    assert True


def test_basic_math():
    """Test basic math operations"""
    assert 2 + 2 == 4
    assert 10 - 5 == 5
    assert 3 * 4 == 12
    assert 8 / 2 == 4


def test_string_operations():
    """Test string operations"""
    text = "Hello World"
    assert len(text) == 11
    assert "Hello" in text
    assert text.upper() == "HELLO WORLD"


@pytest.mark.parametrize("input,expected", [
    (1, 2),
    (2, 4),
    (3, 6),
    (4, 8),
])
def test_double_function(input, expected):
    """Test parametrized function"""
    assert input * 2 == expected
