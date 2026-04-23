import time
from collections import OrderedDict
from collections.abc import Callable
from functools import wraps
from typing import Any


class LRUCache:
    def __init__(self, max_size: int = 128, ttl: int = 300):
        self.max_size = max_size
        self.ttl = ttl
        self.cache: OrderedDict[str, tuple[Any, float]] = OrderedDict()

    def get(self, key: str) -> Any | None:
        if key not in self.cache:
            return None
        value, timestamp = self.cache[key]
        if time.time() - timestamp > self.ttl:
            del self.cache[key]
            return None
        self.cache.move_to_end(key)
        return value

    def set(self, key: str, value: Any) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        elif len(self.cache) >= self.max_size:
            self.cache.popitem(last=False)
        self.cache[key] = (value, time.time())

    def clear(self) -> None:
        self.cache.clear()


weather_cache = LRUCache(max_size=64, ttl=300)


def cache_response(*, _ttl: int = 300, cache: LRUCache | None = None):
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            target_cache = cache or weather_cache
            cache_key = f"{func.__name__}:{str(args)}:{str(sorted(kwargs.items()))}"
            cached = target_cache.get(cache_key)
            if cached is not None:
                return cached
            result = await func(*args, **kwargs)
            target_cache.set(cache_key, result)
            return result

        return wrapper

    return decorator
