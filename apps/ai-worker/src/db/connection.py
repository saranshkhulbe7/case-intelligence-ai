from psycopg import AsyncConnection
from psycopg.rows import dict_row
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


class DatabaseConnection:
    def __init__(self, database_url: str):
        self._database_url = database_url
        self.connection: AsyncConnection | None = None

    async def connect(self) -> AsyncConnection:
        self.connection = await AsyncConnection.connect(
            psycopg_database_url(self._database_url),
            row_factory=dict_row,
        )
        return self.connection

    async def close(self) -> None:
        if self.connection is not None:
            await self.connection.close()
