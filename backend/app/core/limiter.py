"""
Shared rate limiter instance (slowapi). Kept in its own module so both
main.py and individual routers can import it without a circular import.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
