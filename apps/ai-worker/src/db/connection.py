from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool
from urllib.parse import parse_qsl, quote, urlencode, urlsplit, urlunsplit


def psycopg_database_url(database_url: str) -> str:
    parsed = urlsplit(database_url)
    parameters = parse_qsl(parsed.query, keep_blank_values=True)
    schema = next((value for key, value in parameters if key == "schema"), None)
    filtered_parameters = [
        (key, value) for key, value in parameters if key != "schema"
    ]

    if schema:
        filtered_parameters.append(("options", f"-c search_path={schema}"))

    return urlunsplit(
        (
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            urlencode(filtered_parameters, quote_via=quote),
            parsed.fragment,
        )
    )


class DatabasePool:
    def __init__(self, database_url: str, max_size: int):
        self._pool = AsyncConnectionPool(
            conninfo=psycopg_database_url(database_url),
            kwargs={"row_factory": dict_row},
            min_size=1,
            max_size=max_size,
            open=False,
        )

    def connection(self):
        return self._pool.connection()

    async def open(self) -> None:
        await self._pool.open()
        await self._pool.wait()

    async def close(self) -> None:
        await self._pool.close()
